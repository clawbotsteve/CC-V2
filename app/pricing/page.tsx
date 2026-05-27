"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useUserContext } from "@/components/layout/user-context";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { planPacks } from "@/constants/pricing-constants";

type BillingView = "monthly" | "annual";

type CardMeta = {
  // beginner + studio removed from the public page (0 subs, choice-
  // paralysis); union kept loose so the render's key checks still
  // type-check without dead branches needing deletion.
  key: "free" | "beginner" | "starter" | "creator" | "studio";
  name: string;
  topBadge: string;
  subtitle: string;
  cta: string;
  tierMonthly: string;
  tierAnnual: string;
  wrapper: string;
  accent?: string;
  popular?: boolean;
  displayMonthlyPrice: number;
  /**
   * First-month coupon, if any. Stripe coupon ID + the percent it
   * discounts. Drives the "$X first month, then $Y/mo" UI and gets
   * forwarded to /api/billing/pz/subscriptions which applies it via
   * `discounts[0][coupon]=<id>`. Only applies on the monthly plan
   * (the 3-month price IDs are separately discounted via lower price).
   */
  firstMonthCoupon?: { id: string; percentOff: number };
  creditsText: string;
  fullAccess: string[];
  unlimited: string[];
};

// Plan capability source-of-truth (revised 2026-05-01) — keep in sync with
// lib/plan-access.ts. The marketing copy here describes what each tier
// actually unlocks server-side; "fair use" / "unlimited" language was
// dropped because credits are real and finite.
const CARDS: CardMeta[] = [
  {
    key: "free",
    name: "Free",
    topBadge: "NO COMMITMENT",
    subtitle: "TRY THE MAGIC FIRST",
    cta: "Current Plan",
    tierMonthly: "plan_free",
    tierAnnual: "plan_free",
    wrapper: "from-slate-800/70 to-slate-950/80 border-slate-600/40",
    displayMonthlyPrice: 0,
    creditsText: "2 credits/month",
    fullAccess: ["GPT Image 2 (medium)"],
    unlimited: [],
  },
  // Beginner ($9.99) cut from the public page 2026-05-14. Had 0
  // active subscribers (incl. its 3-month variant) — pure choice-
  // paralysis noise on a page now selling ad creative to brands.
  // The SubscriptionTier rows + planPacks entries are intentionally
  // LEFT IN the DB / pricing-constants so TIER_KEY_MAP, plan-access,
  // and any historical references still resolve cleanly. This is a
  // display-only removal; nothing to grandfather (zero subs).
  {
    key: "starter",
    name: "Starter",
    topBadge: "ADD VIDEO + 4K",
    subtitle: "FIRST PAID STEP WITH KLING 2.6",
    cta: "Start Starter",
    tierMonthly: "plan_basic",
    tierAnnual: "plan_basic_3month",
    wrapper: "from-cyan-900/55 to-slate-950/80 border-cyan-500/35",
    displayMonthlyPrice: 19.99,
    creditsText: "200 credits/month",
    fullAccess: [
      "Everything in Beginner (no quality cap)",
      "GPT Image 2 high quality",
      "Nano Banana family up to 4K",
      "Kling 2.6 video (5s + 10s)",
      "1 AI influencer slot",
    ],
    unlimited: [],
  },
  {
    key: "creator",
    name: "Creator",
    topBadge: "MOST CREATORS CHOOSE THIS",
    subtitle: "BEST FOR AI CHARACTER BUILDERS",
    cta: "Build Characters",
    tierMonthly: "plan_pro",
    tierAnnual: "plan_pro_3month",
    wrapper: "from-lime-900/55 to-slate-950/80 border-lime-500/40",
    accent: "bg-lime-300 text-black",
    popular: true,
    displayMonthlyPrice: 49.99,
    firstMonthCoupon: { id: "O79kBqPK", percentOff: 20 },
    creditsText: "600 credits/month",
    fullAccess: [
      "Everything in Starter",
      "Soul 2.0 character lock",
      "Kling Motion Control",
      "Seedance 2.0 reference-to-video",
      "3 AI influencer slots",
      "Priority queue",
    ],
    unlimited: [],
  },
  // Studio ($149.99) RESTORED to the page 2026-05-25. The "zero subs"
  // that got it cut was really zero EXPOSURE — it was hidden from the
  // page, so nobody could buy it. With the B2B Brand/Agency band now
  // removed (we walked back the ecom pivot → "AI influencer creator
  // platform"), Studio is the legitimate top tier for full-time
  // creators running multiple characters. Repositioned for creators,
  // not agencies. Price stays $149.99 (existing Stripe IDs work) so
  // this is a real first price test with actual exposure — if it
  // still gets zero buyers after a month visible, then drop to $99.
  {
    key: "studio",
    name: "Studio",
    topBadge: "FOR FULL-TIME CREATORS",
    subtitle: "RUN MULTIPLE AI CHARACTERS",
    cta: "Go Studio",
    tierMonthly: "plan_elite",
    tierAnnual: "plan_elite_3month",
    wrapper: "from-fuchsia-900/55 to-slate-950/80 border-fuchsia-500/40",
    displayMonthlyPrice: 149.99,
    creditsText: "2,000 credits/month",
    fullAccess: [
      "Everything in Creator",
      "10 AI influencer slots",
      "Highest priority queue",
      "Commercial-use license",
    ],
    unlimited: [],
  },
];

const FAQS = [
  { q: "How do credits work?", a: "Each generation or upscale uses credits based on model cost. Higher-end models and longer videos consume more credits." },
  { q: "Is my subscription automatically renewed?", a: "Yes. Plans auto-renew for the selected billing period until canceled." },
  { q: "How many images or videos can I generate?", a: "As many as your credits allow. Unlimited sections are fair-use and still subject to safeguards." },
  { q: "How can I purchase extra credits?", a: "Extra credit packs are available from billing when enabled for your account." },
  { q: "Can I change my subscription after purchase?", a: "Yes. You can upgrade or downgrade from billing." },
];

export default function PricingPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const isDashboardEmbed = searchParams.get("embed") === "dashboard";
  const { userId, plan, plans, isLoading } = useUserContext();
  const [billing, setBilling] = useState<BillingView>("monthly");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const plansByTier = useMemo(() => {
    const map = new Map<string, any>();
    (plans || []).forEach((p: any) => map.set(p.tier, p));
    return map;
  }, [plans]);

  const onSubscribe = async (subscriptionId: string, couponId?: string) => {
    try {
      setSubmittingId(subscriptionId);
      const response = await fetch("/api/billing/pz/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          userId,
          subscriptionId,
          // Auto-applied first-month coupon. Only sent when the card has
          // one configured AND the user is on the monthly view (3-month
          // plans are discounted via separate price IDs, not coupons).
          couponId,
        }),
      });
      const data = await response.json();
      if (!data?.url) throw new Error("Missing checkout URL");
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      toast.error("Unable to start checkout");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className={`${isDashboardEmbed ? "w-full p-0 space-y-3" : "h-screen overflow-y-auto w-full p-3 md:p-4 space-y-4"}`}>
      {!isDashboardEmbed && (
        <div className="flex justify-end">
          <a href="/dashboard" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10">Back to Home</a>
        </div>
      )}

      <div className="text-center space-y-1">
        <h1 className="text-3xl md:text-4xl font-extrabold">Choose your plan</h1>
        <p className="text-muted-foreground text-sm">Start free. Scale as you create.</p>
      </div>

      <div className="mx-auto w-fit rounded-full border border-white/10 bg-white/5 p-1 flex items-center gap-2">
        <button className={`px-3 py-1.5 text-sm rounded-full ${billing === "monthly" ? "bg-white/20 text-white" : "text-muted-foreground"}`} onClick={() => setBilling("monthly")}>Monthly</button>
        <button className={`px-3 py-1.5 text-sm rounded-full ${billing === "annual" ? "bg-white/20 text-white" : "text-muted-foreground"}`} onClick={() => setBilling("annual")}>3-Months</button>
        <span className="text-xs font-semibold rounded-full bg-pink-500/20 text-pink-200 px-2 py-0.5">20% OFF</span>
      </div>
      <p className="text-center text-xs text-zinc-400 -mt-1">
        {billing === "monthly"
          ? "First-month intro pricing shown on plans where available. Renewal uses standard monthly price."
          : "3-Month plans use flat 20% savings (no intro month discount)."}
      </p>

      {/* 4 cards (Free / Starter / Creator / Studio) — 2026-05-25.
          Beginner stays cut (0 subs, choice-paralysis). Studio
          restored as the creator top tier. 2-col on tablet, 4-col on
          desktop so the cards don't get too narrow. The B2B
          Brand/Agency band was removed entirely (pivot walk-back). */}
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch justify-center">
        {CARDS.map((card) => {
          const tier = billing === "monthly" ? card.tierMonthly : card.tierAnnual;
          const p = plansByTier.get(tier);
          const fallback = Object.values(planPacks).find((pack) => pack.tier === tier);
          const isCurrent = plan === tier;
          const subId = p?.phyziroPriceId || p?.devPriceId || fallback?.phyziroPriceId || fallback?.devPriceId || "";

          const monthlyBasePrice = card.displayMonthlyPrice;
          const discountedAnnualPrice = billing === "annual" && card.key !== "free"
            ? Number((monthlyBasePrice * 0.8).toFixed(2))
            : null;

          // First-month coupon — only relevant on monthly view, only for
          // cards that have one configured. Backed by a real Stripe coupon
          // (Duration: Once), forwarded to the checkout session via
          // discounts[0][coupon]=<id>.
          const introCoupon = billing === "monthly" ? card.firstMonthCoupon : undefined;
          const firstMonthPrice = introCoupon
            ? Number((monthlyBasePrice * (1 - introCoupon.percentOff / 100)).toFixed(2))
            : null;

          return (
            <div key={card.key} className={`relative rounded-xl border bg-gradient-to-b ${card.wrapper} p-2.5 flex flex-col min-h-[500px]`}>
              {card.popular && <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full ${card.accent}`}>MOST POPULAR</div>}

              <div className="text-[10px] tracking-wider font-semibold text-zinc-300 rounded-full border border-white/20 px-2 py-1 w-fit mb-3">{card.topBadge}</div>
              <h3 className="text-[28px] font-bold leading-none">{card.name}</h3>
              <p className="text-xs text-zinc-300 mt-1 tracking-wide">{card.subtitle}</p>

              <div className="mt-3">
                {introCoupon && firstMonthPrice !== null && (
                  <p className="text-[11px] text-zinc-300 mb-1">
                    <span className="line-through text-zinc-400">${monthlyBasePrice.toFixed(2)}/mo</span>{" "}
                    <span className="text-pink-300">{introCoupon.percentOff}% off 1st month</span>
                  </p>
                )}
                <p className="text-[36px] font-extrabold leading-none flex items-end gap-2">
                  {discountedAnnualPrice !== null && typeof monthlyBasePrice === "number" ? (
                    <>
                      <span className="text-pink-400 line-through text-2xl">${Number(monthlyBasePrice).toFixed(2)}</span>
                      <span>${discountedAnnualPrice.toFixed(2)}</span>
                    </>
                  ) : firstMonthPrice !== null ? (
                    <span>${firstMonthPrice.toFixed(2)}</span>
                  ) : (
                    <span>${Number(monthlyBasePrice).toFixed(2)}</span>
                  )}
                  <span className="text-sm font-semibold text-zinc-300">/mo</span>
                </p>
                {introCoupon && firstMonthPrice !== null && (
                  <p className="text-[11px] text-zinc-300 mt-1">
                    First month ${firstMonthPrice.toFixed(2)}, then ${monthlyBasePrice.toFixed(2)}/mo
                  </p>
                )}
                <p className="text-lime-300 font-semibold mt-2 text-sm">{card.creditsText}</p>
              </div>

              <div className="mt-4 space-y-1.5 text-zinc-200 text-[13px]">
                {card.key === "free" ? (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 1 medium-quality GPT Image 2 generation</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Text-to-image only</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> No credit card required</p>
                  </>
                ) : card.key === "beginner" ? (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 80 monthly credits</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> All 4 image models (GPT Image 2, Nano Banana 2, Edit, Flux LoRA)</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Up to 2K resolution</p>
                    <p className="flex items-center gap-2 text-zinc-400">✕ No video, no high-quality / 4K</p>
                  </>
                ) : card.key === "starter" ? (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 200 monthly credits</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Everything in Beginner — no quality caps</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> High-quality GPT Image 2 + 4K Nano Banana</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Kling 2.6 video (5s + 10s)</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 1 AI influencer slot</p>
                  </>
                ) : card.key === "creator" ? (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 600 monthly credits</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Everything in Starter</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Soul 2.0 character lock</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Kling Motion Control + Seedance 2.0 ref-to-video</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 3 AI influencer slots + priority queue</p>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 2,000 monthly credits</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Everything in Creator</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 10 AI influencer slots</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Highest credit allowance + priority</p>
                  </>
                )}
              </div>

              <div className="mt-3 rounded-lg border border-white/15 bg-black/35 p-2">
                <p className="text-[11px] font-bold tracking-wide text-zinc-200 mb-2">FULL ACCESS TO BEST MODELS</p>
                <div className="space-y-1.5">
                  {card.fullAccess.map((item) => (
                    <div key={item} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-zinc-200">{item}</span>
                      <span className="text-[10px] font-semibold rounded bg-lime-300/85 text-black px-2 py-1">FULL ACCESS</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-bold tracking-wide text-zinc-200 mb-1.5">UNLIMITED ACCESS</p>
                <ul className="text-xs text-zinc-300 space-y-1">{card.unlimited.map((u) => <li key={u}>• {u}</li>)}</ul>
              </div>

              <div className="mt-auto pt-2.5">
                <Button
                  className="w-full h-9 text-sm"
                  variant={card.key === "creator" ? "premium" : "outline"}
                  disabled={isLoading || isCurrent || !subId || submittingId === subId}
                  onClick={() => onSubscribe(subId, introCoupon?.id)}
                >
                  {isCurrent ? "Current Plan" : card.cta}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* B2B "Scaling-your-brand" band (Brand $399 / Agency $999 /
          Done-for-you) removed 2026-05-25. We walked back the ecom/DTC
          pivot — Tavira is positioned as an AI influencer creator
          platform now (the actual audience: course graduates building
          characters for IG / TikTok / subscriber platforms), not a B2B
          ad-creative tool for agencies. Zero customers were ever on the
          Brand/Agency tiers. The planPacks + SubscriptionTier rows are
          left intact in pricing-constants so anything historical still
          resolves, but they're no longer surfaced anywhere on the
          public page. */}

      {!isDashboardEmbed && (
        <div className="max-w-3xl mx-auto pt-8 md:pt-12">
          <h2 className="text-3xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4">
                <AccordionTrigger className="py-4 text-left hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
