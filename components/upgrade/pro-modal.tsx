"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProModal } from "@/hooks/use-pro-modal";
import { useUserContext } from "../layout/user-context";
import { PLAN_MAPS, TIER_KEY_MAP } from "@/constants/pricing-constants";
import { mapPlansByTierAndPeriod } from "@/lib/maps-plan-by-tier-period";
import { PlanCard } from "./plan-card";
import { useUser } from "@clerk/nextjs";

export const ProModal = () => {
  const { userId, plan, plans, isLoading: isUserContextLoading } = useUserContext();
  const { user } = useUser()

  const proModal = useProModal();
  const [loading, setLoading] = useState(false);
  const [selectedPeriodByTier, setSelectedPeriodByTier] = useState<Record<string, "monthly" | "three_months">>({});

  // Use plans from user context (fetched from DB)
  // Filter to only show the relevant tiers in the modal
  const plansArray = useMemo(() => {
    if (!plans || !plan) return [];

    return mapPlansByTierAndPeriod(plans);
  }, [plans, plan]);

  const togglePeriod = (tierKey: string) => {
    setSelectedPeriodByTier((prev) => {
      const current = prev[tierKey] || "monthly";
      const next = current === "monthly" ? "three_months" : "monthly";
      return { ...prev, [tierKey]: next };
    });
  };

  const onSubscribe = async (planId: string) => {
    try {
      setLoading(true);

      const response = await fetch('/api/billing/pz/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          userId: userId,
          subscriptionId: planId,
        }),
      })

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
      <DialogContent className="max-w-full w-full sm:w-[90%] max-h-[90vh] overflow-auto p-4 sm:p-8">
        <div className="flex flex-col h-full">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-center text-3xl font-extrabold mb-1">
              Upgrade to Starter
            </DialogTitle>
            <p className="text-center text-muted-foreground text-sm mb-4">
              Plans designed for every creator. No hidden fees. Cancel anytime.
            </p>
          </DialogHeader>

          <div className="overflow-y-auto pr-2">
            {isUserContextLoading ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-64 w-full bg-muted animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                {Object.entries(plansArray).map(([tierKey, periodPlans]) => {
                  const selectedPeriod = selectedPeriodByTier[tierKey] || "monthly";
                  const selectedPlan = periodPlans[selectedPeriod];

                  if (!selectedPlan) {
                    // If no plan for selected period, fallback to other period
                    const fallbackPeriod = selectedPeriod === "monthly" ? "three_months" : "monthly";
                    if (!periodPlans[fallbackPeriod]) return null;
                    selectedPeriodByTier[tierKey] = fallbackPeriod; // set fallback period if needed
                    return null;
                  }

                  const planKey = TIER_KEY_MAP[selectedPlan.tier];
                  const meta = PLAN_MAPS[planKey];
                  const isCurrent = plan === selectedPlan.tier;

                  return (
                    <div key={tierKey} className="space-y-4">
                      {/* Toggle Buttons */}
                      <div className="gap-2 mb-2 justify-center hidden">
                        {periodPlans.monthly && (
                          <button
                            className={`px-4 py-1 rounded-full border ${selectedPeriod === "monthly"
                              ? "bg-blue-50 dark:bg-blue-900 text-foreground border-blue-600"
                              : "bg-transparent border-zinc-300 dark:border-zinc-700"
                              }`}
                            onClick={() => setSelectedPeriodByTier((prev) => ({ ...prev, [tierKey]: "monthly" }))}
                          >
                            Monthly
                          </button>
                        )}
                        {periodPlans.three_months && (
                          <button
                            className={`px-4 py-1 rounded-full border ${selectedPeriod === "three_months"
                              ? "bg-blue-50 dark:bg-blue-900 text-foreground border-blue-600"
                              : "bg-transparent border-zinc-300 dark:border-zinc-700"
                              }`}
                            onClick={() => setSelectedPeriodByTier((prev) => ({ ...prev, [tierKey]: "three_months" }))}
                          >
                            3 Months
                          </button>
                        )}
                      </div>

                      {/* Plan Card */}
                      <PlanCard
                        plan={selectedPlan}
                        planKey={planKey}
                        meta={meta}
                        isCurrent={isCurrent}
                        loading={loading}
                        onSubscribe={onSubscribe}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
};
