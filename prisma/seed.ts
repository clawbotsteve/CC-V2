
import { PlanPack, planPacks, TOOL_COSTS_BY_TIER } from "@/constants/pricing-constants";
import { creditPackDetails, creditToPriceId } from "@/constants";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertSubscriptionTier(plan: PlanPack) {
  try {
    console.log(`🔍 Checking for existing tier: ${plan.tier}`);
    const existingTier = await prisma.subscriptionTier.findUnique({
      where: { tier: plan.tier },
    });

    if (existingTier) {
      console.log(`✏️ Updating tier: ${plan.tier}`);

      const updateData: Prisma.SubscriptionTierUpdateInput = {
        name: plan.name,
        price: plan.price,
        creditsPerMonth: plan.creditsPerMonth,
        maxAvatarCount: plan.maxAvatarCount,
      };

      if (plan.devPriceId?.trim()) {
        updateData.devPriceId = plan.devPriceId;
      }

      if(plan.phyziroPriceId?.trim()) {
        updateData.phyziroPriceId = plan.phyziroPriceId
      }

      const updated = await prisma.subscriptionTier.update({
        where: { id: existingTier.id },
        data: updateData,
      });
      return updated;
    } else {
      console.log(`➕ Creating new tier: ${plan.tier}`);
      const created = await prisma.subscriptionTier.create({
        data: {
          name: plan.name,
          tier: plan.tier,
          price: plan.price,
          period: plan.period,
          creditsPerMonth: plan.creditsPerMonth,
          speed: "standard",
          support: "community_email",
          maxAvatarCount: plan.maxAvatarCount,
          devPriceId: plan.devPriceId,
          phyziroPriceId: plan.phyziroPriceId,
          status: "active"
        },
      });
      return created;
    }
  } catch (error) {
    console.error(`❌ Error in upsertSubscriptionTier for tier ${plan.tier}:`, error);
    throw error;
  } finally {
    console.log("---------------------------------------------")
  }
}

async function upsertToolCosts(tierId: string, tierKey: string) {
  try {
    console.log(`🧹 Deleting existing toolCosts for tierId: ${tierId}`);
    await prisma.toolCreditCost.deleteMany({ where: { tierId } });

    const toolCosts = TOOL_COSTS_BY_TIER[tierKey].map(({ tool, variant, creditCost }) => ({
      tool,
      variant: variant,
      creditCost,
      tierId,
    }));

    if (toolCosts.length > 0) {
      console.log(`➕ Creating ${toolCosts.length} toolCosts for tierId: ${tierId}`);
      await prisma.toolCreditCost.createMany({ data: toolCosts });
    }
  } catch (error) {
    console.error(`❌ Error in upsertToolCosts for tierKey ${tierKey}, tierId ${tierId}:`, error);
    throw error;
  } finally {
    console.log("---------------------------------------------")
  }
}

async function main() {
  for (const [key, plan] of Object.entries(planPacks)) {
    const savedTier = await upsertSubscriptionTier(plan);

    await upsertToolCosts(savedTier.id, plan.tier);
    console.log(`Processed subscription tier: ${plan.key}`);
  }
}

async function seedCreditPacks() {
  for (const packId of Object.keys(creditToPriceId)) {
    const { name, credits, price } = creditPackDetails[packId];

    await prisma.creditPack.upsert({
      where: { packId },
      update: {
        name,
        credits,
        price,
        autoTopUpAvailable: true,
      },
      create: {
        name,
        credits,
        price,
        autoTopUpAvailable: true,
        packId,
      },
    });

    console.log(`✅ Seeded credit pack: ${name} (${credits} credits, $${price})`);
  }
}

main()
  .then(async () => {
    console.log("Seeding subscription tiers complete. Now seeding credit packs...");
    await seedCreditPacks();
    console.log("✅ All seeding complete.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
