"use client";

import { useUserContext } from "@/components/layout/user-context";
import { PlanLabel } from "@/components/plan-label";
import { SubscriptionButton } from "@/components/subscription-button";
import { TIER_KEY_MAP, PLAN_MAPS, planPacks } from "@/constants/pricing-constants";
import { CreditCard, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import type { UserSubscriptionResponse } from "@/app/api/user/subscription/route";

export default function SubscriptionPage() {
  const { plan, availableCredit, totalCredit, isLoading } = useUserContext();
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);

  const planKey = plan ? TIER_KEY_MAP[plan] : "Free";
  const planInfo = planKey ? PLAN_MAPS[planKey] : PLAN_MAPS.Free;
  const planPack = planKey ? planPacks[planKey] : planPacks.Free;
  const creditPercent = totalCredit ? Math.round(((availableCredit || 0) / totalCredit) * 100) : 0;
  const isFree = !plan || plan === "plan_free";

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await axios.post<UserSubscriptionResponse>("/api/user/subscription");
        setSubscription(res.data);
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      }
    };
    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-[#0f1016]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Current Plan</span>
            </div>
            <h2 className="text-xl font-bold">
              <PlanLabel plan={plan} />
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{planInfo?.description}</p>
          </div>
          {!isFree && (
            <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-medium text-lime-300">
              Active
            </span>
          )}
        </div>

        {/* Credits bar */}
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-300">Credits remaining</span>
            <span className="text-sm font-medium text-zinc-100">
              {availableCredit ?? 0} / {totalCredit ?? 0}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              style={{ width: `${creditPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {creditPercent}% of your monthly credits remaining
          </p>
        </div>

        {/* Price */}
        {!isFree && (
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-bold">${planPack?.price}</span>
            <span className="text-sm text-zinc-400">
              /{planPack?.period === "three_months" ? "quarter" : "month"}
            </span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <h3 className="text-base font-semibold mb-4">Plan Features</h3>
        <ul className="space-y-2.5">
          {planInfo?.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">
              {isFree ? "Upgrade your plan" : "Manage subscription"}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {isFree
                ? "Unlock all tools, more credits, and priority processing."
                : "Change your plan or cancel your subscription."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
            >
              {isFree ? "Upgrade" : "Change Plan"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            {subscription && <SubscriptionButton subscription={subscription} />}
          </div>
        </div>
      </div>
    </div>
  );
}
