import prismadb from "@/lib/prismadb";
import { BillingPeriod, PlanStatus, SpeedLevel, SupportLevel } from "@prisma/client";

/**
 * Retrieves the plan ID for a given subscription tier.
 * If the free tier is missing in a fresh/misaligned DB, we self-heal by creating it.
 */
export async function getPlanIdByTier(tier: string): Promise<string> {
  const plan = await prismadb.subscriptionTier.findUnique({
    where: { tier },
    select: { id: true },
  });

  if (plan) return plan.id;

  // Self-heal common bootstrap issue: missing free plan record.
  if (tier === "plan_free") {
    const created = await prismadb.subscriptionTier.create({
      data: {
        name: "Free Plan",
        tier: "plan_free",
        price: 0,
        period: BillingPeriod.monthly,
        creditsPerMonth: 5,
        speed: SpeedLevel.standard,
        support: SupportLevel.community_email,
        maxAvatarCount: 0,
        devPriceId: "",
        phyziroPriceId: "",
        status: PlanStatus.active,
      },
      select: { id: true },
    });

    return created.id;
  }

  throw new Error(`No subscription tier found with tier name: ${tier}`);
}
