import { SubscriptionTier } from "@prisma/client";

// Define once
export type CleanSubscriptionTier = Omit<
  SubscriptionTier,
  "speed" | "support" | "status" | "createdAt" | "updatedAt"
>;

export type PlanMap = {
  [tier: string]: {
    monthly?: CleanSubscriptionTier;
    three_months?: CleanSubscriptionTier;
  };
};

export function mapPlansByTierAndPeriod(
  plans: CleanSubscriptionTier[]
): PlanMap {
  const planMap: PlanMap = {};

  // Group by baseTier
  for (const plan of plans) {
    const baseTier = plan.tier.replace(/_3month$/, "");
    const periodKey = plan.period === "three_months" ? "three_months" : "monthly";

    if (!planMap[baseTier]) {
      planMap[baseTier] = {};
    }

    planMap[baseTier][periodKey] = plan;
  }

  // Create array of [baseTier, plans] for sorting
  const entries = Object.entries(planMap);

  // Sort by the minimum price within each baseTier group
  entries.sort(([, plansA], [, plansB]) => {
    const pricesA = Object.values(plansA).map(p => p.price);
    const pricesB = Object.values(plansB).map(p => p.price);

    const minPriceA = Math.min(...pricesA);
    const minPriceB = Math.min(...pricesB);

    return minPriceA - minPriceB;
  });

  // Reconstruct sorted planMap
  const sortedPlanMap: PlanMap = {};
  for (const [baseTier, plans] of entries) {
    sortedPlanMap[baseTier] = plans;
  }

  return sortedPlanMap;
}
