import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();
const PLAN_STARTER = "plan_basic"; // DB tier name for Starter plan
const TEST_EMAIL = "testuser@mail.com";
const TEST_CREDITS = 10000;

/**
 * Sets up test user with Pro plan and 10,000 credits for staging environment only
 * Usage: npx ts-node scripts/setup-staging-test-user.ts
 */
async function setupStagingTestUser() {
  // Check if we're in staging environment
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
  const vercelEnv = process.env.VERCEL_ENV;
  const nodeEnv = String(process.env.NODE_ENV || "");
  const dbUrl = process.env.DATABASE_URL || "";

  const environment = railwayEnv || vercelEnv || nodeEnv || "development";
  const isStaging =
    railwayEnv === "staging" ||
    vercelEnv === "staging" ||
    nodeEnv === "staging" ||
    dbUrl.includes("staging");

  if (!isStaging) {
    console.error("❌ This script can only be run in staging environment!");
    console.error(`   Current environment: ${environment}`);
    console.error("   Set NODE_ENV=staging or ensure DATABASE_URL contains 'staging'");
    process.exit(1);
  }

  console.log(`\n🧪 Setting up test user for STAGING environment`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Plan: Pro Plan`);
  console.log(`   Credits: ${TEST_CREDITS}\n`);

  try {
    // Step 1: Find or create the test user
    console.log("1️⃣ Finding or creating test user...");

    // First, try to find existing user by email
    let user = await prisma.user.findFirst({
      where: { email: TEST_EMAIL },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { userId: user.userId },
        data: {
          name: "Test User (Staging)",
          isActive: true,
          isBanned: false,
        },
      });
      console.log(`   ✅ Found existing user: ${user.userId} (${user.id})\n`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          userId: `user_test_staging_${Date.now()}`,
          email: TEST_EMAIL,
          name: "Test User (Staging)",
          imageUrl: "",
          firstVisit: false,
          referralCode: "",
          hasCompletedOnboarding: false,
          isActive: true,
          isBanned: false,
          featuresUsed: [],
        },
      });
      console.log(`   ✅ Created new user: ${user.userId} (${user.id})\n`);
    }

    // Step 2: Get the Pro plan
    console.log("2️⃣ Fetching Pro plan...");
    const proPlan = await prisma.subscriptionTier.findUnique({
      where: { tier: PLAN_STARTER },
    });

    if (!proPlan) {
      throw new Error(`Starter plan (${PLAN_STARTER}) not found. Please run seed script first.`);
    }

    console.log(`   ✅ Pro plan ID: ${proPlan.id}`);
    console.log(`   ✅ Pro plan name: ${proPlan.name}`);
    console.log(`   ✅ Pro plan credits per month: ${proPlan.creditsPerMonth}\n`);

    // Step 3: Create or update UserSubscription to Pro Plan
    console.log("3️⃣ Setting up subscription to Pro Plan...");
    const subscription = await prisma.userSubscription.upsert({
      where: { userId: user.userId },
      update: {
        planId: proPlan.id,
        status: "active",
        phyziroSubscriptionId: `test_sub_${Date.now()}`,
        phyziroCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      create: {
        userId: user.userId,
        planId: proPlan.id,
        status: "active",
        phyziroSubscriptionId: `test_sub_${Date.now()}`,
        phyziroCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    console.log(`   ✅ Subscription ID: ${subscription.id}`);
    console.log(`   ✅ Status: ${subscription.status}\n`);

    // Step 4: Update UserApiLimit with 10,000 credits
    console.log("4️⃣ Setting credits to 10,000...");
    const apiLimit = await prisma.userApiLimit.upsert({
      where: { userId: user.userId },
      update: {
        availableCredit: TEST_CREDITS,
        monthlyRemainingCredits: proPlan.creditsPerMonth,
        availableAvatarSlot: proPlan.maxAvatarCount,
      },
      create: {
        userId: user.userId,
        availableCredit: TEST_CREDITS,
        monthlyRemainingCredits: proPlan.creditsPerMonth,
        availableAvatarSlot: proPlan.maxAvatarCount,
        avatarSlotUsed: 0,
        creditUsed: 0,
      },
    });
    console.log(`   ✅ Credits updated:`);
    console.log(`      - Available Credits: ${apiLimit.availableCredit}`);
    console.log(`      - Monthly Remaining Credits: ${apiLimit.monthlyRemainingCredits}`);
    console.log(`      - Avatar Slots: ${apiLimit.availableAvatarSlot}\n`);

    console.log("🎉 Staging test user setup completed successfully!");
    console.log(`\n📋 Summary:`);
    console.log(`   Environment: ${environment} (STAGING)`);
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   User ID: ${user.userId}`);
    console.log(`   Plan: ${proPlan.name} (${PLAN_STARTER})`);
    console.log(`   Credits: ${apiLimit.availableCredit}`);
    console.log(`   Monthly Credits: ${apiLimit.monthlyRemainingCredits}`);
    console.log(`   Avatar Slots: ${apiLimit.availableAvatarSlot}`);
    console.log(`   Subscription Status: ${subscription.status}\n`);

    return {
      userId: user.userId,
      email: TEST_EMAIL,
      plan: proPlan.name,
      credits: apiLimit.availableCredit,
      subscriptionStatus: subscription.status,
    };
  } catch (error) {
    console.error("❌ Error setting up staging test user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupStagingTestUser()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

