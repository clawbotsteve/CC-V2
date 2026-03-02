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
const TEST_EMAIL = "testuser@mail.com";

/**
 * Finds the Clerk user ID for the test user email
 * Usage: npx ts-node scripts/find-clerk-user-id.ts
 */
async function findClerkUserId() {
  console.log(`\n🔍 Finding Clerk user ID for: ${TEST_EMAIL}\n`);

  try {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: TEST_EMAIL },
    });

    if (!user) {
      console.error(`❌ User with email ${TEST_EMAIL} not found in database`);
      console.log("\n💡 Make sure you've run the setup-staging-test-user script first\n");
      process.exit(1);
    }

    console.log(`✅ Found user in database:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current User ID: ${user.userId}`);
    console.log(`   Database ID: ${user.id}\n`);

    // Check if userId looks like a Clerk ID (starts with "user_")
    if (user.userId.startsWith("user_") && user.userId.length > 10) {
      console.log(`✅ This looks like a Clerk user ID: ${user.userId}`);
      console.log(`\n💡 To link this to a different Clerk account, run:`);
      console.log(`   npx ts-node scripts/link-test-user-to-clerk.ts <clerk_user_id>\n`);
    } else {
      console.log(`⚠️  Current User ID doesn't look like a Clerk ID`);
      console.log(`\n💡 To link to a Clerk account:`);
      console.log(`   1. Sign in with ${TEST_EMAIL} in your app`);
      console.log(`   2. Check the browser console for your Clerk user ID (it starts with "user_")`);
      console.log(`   3. Or check your Clerk dashboard`);
      console.log(`   4. Then run: npx ts-node scripts/link-test-user-to-clerk.ts <clerk_user_id>\n`);
    }

    return user.userId;
  } catch (error) {
    console.error("❌ Error finding user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
findClerkUserId()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

