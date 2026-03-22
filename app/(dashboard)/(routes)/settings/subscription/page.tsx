"use client";

import { useUserContext } from "@/components/layout/user-context";
import { PlanLabel } from "@/components/plan-label";
import { SubscriptionButton } from "@/components/subscription-button";
import { TIER_KEY_MAP, PLAN_MAPS, planPacks } from "@/constants/pricing-constants";
import {
  CreditCard,
  Sparkles,
  ArrowUpRight,
  Receipt,
  ChevronDown,
  Wallet,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import type { UserSubscriptionResponse } from "@/app/api/user/subscription/route";
import { cn } from "@/lib/utils";
import { BuyCreditsModal } from "@/components/buy-credits-modal";

export default function SubscriptionPage() {
  const { plan, availableCredit, totalCredit, isLoading } = useUserContext();
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);

  const planKey = plan ? TIER_KEY_MAP[plan] : "Free";
  const planInfo = planKey ? PLAN_MAPS[planKey] : PLAN_MAPS.Free;
  const planPack = planKey ? planPacks[planKey] : planPacks.Free;
  const creditPercent = totalCredit
    ? Math.round(((availableCredit || 0) / totalCredit) * 100)
    : 0;
  const isFree = !plan || plan === "plan_free";

  const periodEnd = subscription?.phyziroCurrentPeriodEnd
    ? new Date(subscription.phyziroCurrentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-white/10 bg-[#0f1016]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── SUBSCRIPTION ── */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-lime-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Subscription
          </span>
        </div>

        {/* Plan row */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  <PlanLabel plan={plan} />
                </span>
                {!isFree && (
                  <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-lime-300">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {isFree
                  ? "Limited trial access"
                  : `${planPack?.creditsPerMonth} credits · Billed ${planPack?.period === "three_months" ? "quarterly" : "monthly"}`}
              </p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 transition"
          >
            Manage plan
          </Link>
        </div>

        {/* Seats / additional info */}
        {!isFree && periodEnd && (
          <div className="mt-3 flex items-center gap-2 px-1 text-xs text-zinc-500">
            <Info className="h-3.5 w-3.5" />
            <span>Next billing date: {periodEnd}</span>
          </div>
        )}
      </section>

      {/* ── CREDITS ── */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-lime-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Credits
          </span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-zinc-400">Monthly credits left</span>
            <Info className="h-3.5 w-3.5 text-zinc-600" />
          </div>
          <button
            onClick={() => setBuyCreditsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-bold text-black hover:bg-lime-300 transition"
          >
            + Buy credits
          </button>
        </div>

        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-bold tabular-nums">
            {(availableCredit ?? 0).toLocaleString()}
          </span>
          <span className="text-lg text-zinc-500">
            / {(totalCredit ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${creditPercent}%` }}
          />
        </div>
      </section>

      {/* ── UPCOMING INVOICE ── */}
      {!isFree && (
        <section className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Upcoming Invoice
              </span>
            </div>
            <Link
              href="/dashboard/billing"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
            >
              All invoices
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-3 bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-500">
              <span>Description</span>
              <span>Due on</span>
              <span className="text-right">Total</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-3 text-sm">
              <span className="text-zinc-200">{planInfo?.name}</span>
              <span className="text-zinc-400">{periodEnd || "—"}</span>
              <span className="text-right font-medium text-zinc-200">
                ${planPack?.price}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── PAYMENT METHOD ── */}
      {!isFree && (
        <section className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Payment Methods
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
            Payment methods are managed through your billing provider.
          </div>
        </section>
      )}

      {/* ── BILLING INFORMATION ── */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Billing information</h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              Manage your billing details displayed on your invoices
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 transition"
          >
            Manage
          </Link>
        </div>
      </section>

      {/* ── MANAGE SUBSCRIPTION (collapsible — hides cancel) ── */}
      {!isFree && subscription && (
        <section className="rounded-2xl border border-white/10 bg-[#0f1016]">
          <button
            onClick={() => setManageOpen(!manageOpen)}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div>
              <h3 className="text-base font-semibold text-zinc-300">
                Advanced subscription options
              </h3>
              <p className="mt-0.5 text-sm text-zinc-500">
                Change or cancel your current plan
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-zinc-500 transition-transform",
                manageOpen && "rotate-180"
              )}
            />
          </button>

          {manageOpen && (
            <div className="border-t border-white/10 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-400">
                  Need to change plans or cancel? Use the options below.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition"
                  >
                    Change Plan
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <SubscriptionButton subscription={subscription} />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Free user upgrade CTA */}
      {isFree && (
        <section className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">Upgrade your plan</h3>
              <p className="mt-0.5 text-sm text-zinc-400">
                Unlock all tools, more credits, and priority processing.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-lime-300 transition"
            >
              Upgrade
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Buy Credits Modal */}
      <BuyCreditsModal open={buyCreditsOpen} onClose={() => setBuyCreditsOpen(false)} />
    </div>
  );
}
