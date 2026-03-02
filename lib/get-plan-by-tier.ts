import prismadb from "@/lib/prismadb";
import { SubscriptionTier } from "@prisma/client";

/**
 * Retrieves the plan ID for a given subscription tier (e.g. "free", "pro").
 * @param tier - Unique tier name (must match `SubscriptionTier.tier`)
 * @returns plan ID as string
 */
export async function getPlanByTier(tier: string): Promise<SubscriptionTier> {
  const plan = await prismadb.subscriptionTier.findUnique({
    where: { tier },
  });

  if (!plan) {
    throw new Error(`No subscription tier found with tier name: ${tier}`);
  }

  return plan;
}
