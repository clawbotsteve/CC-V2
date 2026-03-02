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
  key: "free" | "starter" | "creator" | "studio";
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
  creditsText: string;
  fullAccess: string[];
  unlimited: string[];
};

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
    creditsText: "5 credits/month",
    fullAccess: ["Nano Banana Pro"],
    unlimited: ["—"],
  },
  {
    key: "starter",
    name: "Starter",
    topBadge: "BEST FOR FIRST 30 DAYS",
    subtitle: "GET MOVING FAST",
    cta: "Start Starter",
    tierMonthly: "plan_basic",
    tierAnnual: "plan_basic_3month",
    wrapper: "from-cyan-900/55 to-slate-950/80 border-cyan-500/35",
    displayMonthlyPrice: 19.99,
    creditsText: "200 credits/month",
    fullAccess: ["Kling 2.6", "Nano Banana Pro", "Nano Banana 2", "Topaz Upscale"],
    unlimited: ["Image generations (fair use)", "Prompt optimizer"],
  },
  {
    key: "creator",
    name: "Creator",
    topBadge: "MOST CREATORS CHOOSE THIS",
    subtitle: "BEST PLAN FOR AI CHARACTER BUILDERS",
    cta: "Build Characters",
    tierMonthly: "plan_pro",
    tierAnnual: "plan_pro_3month",
    wrapper: "from-lime-900/55 to-slate-950/80 border-lime-500/40",
    accent: "bg-lime-300 text-black",
    popular: true,
    displayMonthlyPrice: 49.99,
    creditsText: "600 credits/month",
    fullAccess: ["Kling Motion Control", "SeedVR Image Upscale", "Bytedance Video Upscale", "Nano Banana 2 Edit"],
    unlimited: ["Image generations (fair use)", "Prompt optimizer", "Advanced creator workflows"],
  },
  {
    key: "studio",
    name: "Studio",
    topBadge: "BUILT FOR SERIOUS SCALE",
    subtitle: "FOR AGENCIES AND OPERATORS",
    cta: "Scale with Studio",
    tierMonthly: "plan_elite",
    tierAnnual: "plan_elite_3month",
    wrapper: "from-fuchsia-900/50 to-slate-950/80 border-fuchsia-500/35",
    displayMonthlyPrice: 149.99,
    creditsText: "2,000 credits/month",
    fullAccess: ["All Creator models", "Veo 3.1 (4s/8s)", "All upscale + all video"],
    unlimited: ["Image generations (fair use)", "Prompt optimizer", "Priority render queue"],
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

  const onSubscribe = async (subscriptionId: string) => {
    try {
      setSubmittingId(subscriptionId);
      const response = await fetch("/api/billing/pz/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          userId,
          subscriptionId,
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
        <h1 className="text-3xl md:text-4xl font-extrabold">Upgrade to Starter</h1>
        <p className="text-muted-foreground text-sm">Start free. Scale as you create.</p>
      </div>

      <div className="mx-auto w-fit rounded-full border border-white/10 bg-white/5 p-1 flex items-center gap-2">
        <button className={`px-3 py-1.5 text-sm rounded-full ${billing === "monthly" ? "bg-white/20 text-white" : "text-muted-foreground"}`} onClick={() => setBilling("monthly")}>Monthly</button>
        <button className={`px-3 py-1.5 text-sm rounded-full ${billing === "annual" ? "bg-white/20 text-white" : "text-muted-foreground"}`} onClick={() => setBilling("annual")}>Annual</button>
        <span className="text-xs font-semibold rounded-full bg-pink-500/20 text-pink-200 px-2 py-0.5">20% OFF</span>
      </div>

      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5 items-stretch">
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

          return (
            <div key={card.key} className={`relative rounded-xl border bg-gradient-to-b ${card.wrapper} p-2.5 flex flex-col min-h-[500px]`}>
              {card.popular && <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full ${card.accent}`}>MOST POPULAR</div>}

              <div className="text-[10px] tracking-wider font-semibold text-zinc-300 rounded-full border border-white/20 px-2 py-1 w-fit mb-3">{card.topBadge}</div>
              <h3 className="text-[28px] font-bold leading-none">{card.name}</h3>
              <p className="text-xs text-zinc-300 mt-1 tracking-wide">{card.subtitle}</p>

              <div className="mt-3">
                <p className="text-[36px] font-extrabold leading-none flex items-end gap-2">
                  {discountedAnnualPrice !== null && typeof monthlyBasePrice === "number" ? (
                    <>
                      <span className="text-pink-400 line-through text-2xl">${Number(monthlyBasePrice).toFixed(2)}</span>
                      <span>${discountedAnnualPrice.toFixed(2)}</span>
                    </>
                  ) : (
                    <span>${Number(monthlyBasePrice).toFixed(2)}</span>
                  )}
                  <span className="text-sm font-semibold text-zinc-300">/mo</span>
                </p>
                <p className="text-lime-300 font-semibold mt-2 text-sm">{card.creditsText}</p>
              </div>

              <div className="mt-4 space-y-1.5 text-zinc-200 text-[13px]">
                {card.key === "free" ? (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 5 Nano Banana Pro images</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Watermarked output</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Signup required</p>
                  </>
                ) : card.key === "starter" ? (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> 24h trial (50 credits)</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Nano Banana Pro + Nano Banana 2 + Kling 2.6 + Topaz Upscale</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Prompt tools included</p>
                    <p className="flex items-center gap-2 text-zinc-400">✕ Motion Control / Veo / premium upscale</p>
                  </>
                ) : card.key === "creator" ? (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Everything in Starter</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Motion Control + Nano Banana 2 Edit + all Upscale</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Full edit suite</p>
                    <p className="flex items-center gap-2 text-zinc-400">✕ Veo 3.1</p>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Everything in Creator</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Veo 3.1 access</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Highest concurrency</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-lime-300" /> Priority rendering</p>
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
                  onClick={() => onSubscribe(subId)}
                >
                  {isCurrent ? "Current Plan" : card.cta}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

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
