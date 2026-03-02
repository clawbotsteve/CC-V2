"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_MAPS, PlanKey } from "@/constants/pricing-constants";
import { useState } from "react";
import { toast } from "sonner";
import { useUserContext } from "@/components/layout/user-context";
import { useUser } from "@clerk/nextjs";

export const SubscriptionPlanList = () => {
  const { userId, plan, plans, isLoading } = useUserContext();
  const { user } = useUser()

  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  // console.log({ plans })

  const handleSubscribe = (planId: string) => {
    setLoadingId(planId);

    // Call your subscription logic here
    // Simulate with setTimeout or replace with actual function
    onSubscribe(planId).finally(() => setLoadingId(null));
  };

  return (
    <>
      {/* Skeleton Loader */}
      {isLoading && (
        <>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-2xl border shadow-sm bg-background">
              <CardContent className="p-6 flex flex-col justify-between h-full animate-pulse">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-6 bg-muted rounded w-32"></div>
                    <div className="h-5 bg-muted rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                  <ul className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <li key={j} className="h-4 bg-muted rounded w-full"></li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 h-10 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {!isLoading && plans?.filter((p) => p.tier !== "plan_free")?.map((p) => {
        const isCurrent = p.tier === plan;
        const planKey = p.tier
          .replace(/_\d{2}$/, "")
          .replace("plan_", "")
          .replace(/^\w/, c => c.toUpperCase()) as PlanKey;

        if (!PLAN_MAPS.hasOwnProperty(planKey)) {
          return null;
        }

        const meta = PLAN_MAPS[planKey];
        const planId = p.phyziroPriceId ?? ""
        const canSubscribe = planId !== "" && !isCurrent && !isLoading;

        return (
          <Card
            key={p.id}
            className={cn(
              "rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 bg-background",
              meta.recommended && "border-primary bg-primary/5",
              isCurrent && "border-green-600 bg-green-50 dark:bg-green-900"
            )}
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{meta.name}</h3>
                  {isCurrent ? (
                    <Badge variant="secondary" className="bg-green-600 text-white">
                      Your Plan
                    </Badge>
                  ) : (
                    meta.recommended && (
                      <Badge variant="premium">Most Popular</Badge>
                    )
                  )}
                </div>

                <p className="text-muted-foreground text-sm mb-4">
                  <strong className="text-primary font-semibold bg-primary/20 px-2 py-0.5 rounded-md">
                    {p.creditsPerMonth} credits / Monthly
                  </strong>{" "}
                  <strong>{p.maxAvatarCount} Avatar Training</strong>
                  <br />
                  <span>{meta.description}</span>
                </p>

                <p className="text-3xl font-extrabold mb-4 text-primary">
                  ${p.price}
                  <span className="text-sm font-normal text-zinc-500">/mo</span>
                </p>

                <ul className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {meta.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-1" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={meta.recommended ? "premium" : "outline"}
                className={cn("mt-6 w-full", !canSubscribe && "opacity-60 cursor-not-allowed")}
                disabled={!canSubscribe || loadingId === planId}
                onClick={() => handleSubscribe(planId)}
              >
                {loadingId === planId ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  meta.recommended && <Sparkles className="w-4 h-4 mr-4" />
                )}
                {loadingId === planId
                  ? "Processing..."
                  : isCurrent
                    ? "Current Plan"
                    : (() => {
                      const currentPlan = plans?.find(pl => pl.tier === plan);
                      if (currentPlan) {
                        if (p.price > currentPlan.price) return `Upgrade to ${meta.name}`;
                        if (p.price < currentPlan.price) return `Downgrade to ${meta.name}`;
                      }
                      return `Choose ${meta.name}`;
                    })()}
              </Button>

            </CardContent>
          </Card>
        );
      })}
    </>
  );
};
