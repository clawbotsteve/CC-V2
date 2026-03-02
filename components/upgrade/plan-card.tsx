"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CleanSubscriptionTier } from "@/lib/maps-plan-by-tier-period";

interface PlanCardProps {
  plan: CleanSubscriptionTier;
  planKey: string;
  meta: {
    name: string;
    description: string;
    features: string[];
    recommended?: boolean;
  };
  isCurrent: boolean;
  loading: boolean;
  onSubscribe: (planId: string) => void;
}

export function PlanCard({
  plan: p,
  planKey,
  meta,
  isCurrent,
  loading,
  onSubscribe,
}: PlanCardProps) {
  // const planId =
  //   process.env.NODE_ENV === "development"
  //     ? p.devPriceId ?? ""
  //     : p.phyziroPriceId ?? "";

  const planId = p.phyziroPriceId ?? ""

  const canSubscribe = planId !== "" && !isCurrent && !loading;

  return (
    <Card
      key={p.id}
      className={cn(
        "rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 bg-background",
        meta?.recommended && "border-primary bg-primary/5",
        isCurrent && "border-green-600 bg-green-50 dark:bg-green-900"
      )}
    >
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{meta?.name || p.name}</h3>
            {isCurrent ? (
              <Badge variant="secondary" className="bg-green-600 text-white">
                Your Plan
              </Badge>
            ) : (
              planKey &&
              meta.recommended && <Badge variant="premium">Most Popular</Badge>
            )}
          </div>

          <p className="text-muted-foreground text-sm mb-4">
            <span>
              <strong className="text-primary font-semibold bg-primary/20 px-2 py-0.5 rounded-md">
                {p.creditsPerMonth * (p.period === "three_months" ? 3 : 1)} credits /{" "}
                {p.period === "monthly" ? "Monthly" : "3 Months"}

              </strong>
              <br />
              <strong>{p.maxAvatarCount} Avatar Training</strong>
            </span>
            <br />
            <span>{meta?.description}</span>
          </p>

          <p className="text-3xl font-extrabold mb-4 text-primary">
            ${p.price}
            <span className="text-sm font-normal text-zinc-500">/mo</span>
          </p>

          {planKey && (
            <ul className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              {meta.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-1" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {planKey && (
          <Button
            variant={meta.recommended ? "premium" : "outline"}
            className={cn("mt-6 w-full", !canSubscribe && "opacity-60 cursor-not-allowed")}
            disabled={!canSubscribe}
            onClick={() => {
              if (canSubscribe) {
                onSubscribe(planId);
              }
            }}
          >
            {meta.recommended && <Sparkles className="w-4 h-4 mr-4" />}
            {isCurrent ? "Current Plan" : `Choose ${meta.name}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
