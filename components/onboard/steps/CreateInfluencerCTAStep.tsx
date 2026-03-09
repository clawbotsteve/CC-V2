"use client";

import { useUserContext } from "@/components/layout/user-context";
import { Button } from "@/components/ui/button";
import { PLAN_MAPS, TIER_KEY_MAP, PlanKey } from "@/constants/pricing-constants";
import { Crown, Sparkles, Star, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateInfluencerCTAStepProps {
  currentStep: number;
  onClose: () => void;
}

export default function CreateInfluencerCTAStep({
  currentStep,
  onClose,
}: CreateInfluencerCTAStepProps) {
  const { plans } = useUserContext();
  const router = useRouter();

  const handleStartPlan = () => {
    onClose();
    router.push("/dashboard/get-credits");
  };

  const planIcons: Record<string, React.ReactNode> = {
    Starter: <Star className="w-5 h-5 text-yellow-400" />,
    Creator: <Sparkles className="w-5 h-5 text-indigo-400" />,
    Studio: <Crown className="w-5 h-5 text-violet-400" />,
  };

  if (currentStep !== 5) return null;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-white text-3xl font-bold">
          Create Your AI Influencer
        </h3>
        <p className="text-white/70 text-lg max-w-xl mx-auto">
          Train a custom AI model on your unique style, then generate
          unlimited photos, videos, and content — all from one platform.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {plans
          ?.filter((p) => p.tier !== "plan_free")
          ?.map((p) => {
            const planKey = TIER_KEY_MAP[p.tier] as PlanKey;
            if (!planKey || !PLAN_MAPS.hasOwnProperty(planKey)) return null;
            const meta = PLAN_MAPS[planKey];
            const isRecommended = meta.recommended;

            return (
              <div
                key={p.id}
                className={`relative rounded-xl border p-5 flex flex-col items-center text-center transition-all ${
                  isRecommended
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-2 mt-1">
                  {planIcons[planKey] || <Star className="w-5 h-5 text-white/50" />}
                </div>
                <h4 className="text-white font-bold text-lg">{meta.name.replace(" Plan", "")}</h4>
                <p className="text-2xl font-extrabold text-white mt-1">
                  ${p.price}
                  <span className="text-sm font-normal text-white/50">/mo</span>
                </p>
                <p className="text-xs text-indigo-300 mt-1 font-medium">
                  {p.creditsPerMonth} credits/month
                </p>
                <ul className="text-xs text-white/60 mt-3 space-y-1.5 text-left w-full">
                  {meta.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
      </div>

      {/* CTA Button */}
      <div className="text-center space-y-3">
        <Button
          onClick={handleStartPlan}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg shadow-indigo-500/25"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Your Plan Today
        </Button>
        <p className="text-white/40 text-xs">
          Cancel anytime. No long-term commitment.
        </p>
      </div>
    </div>
  );
}
