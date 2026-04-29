import { Sparkles, Star, Shield, Crown } from "lucide-react";
import { JSX } from "react";

export type DisplayPlan = "FREE" | "BEGINNER" | "STARTER" | "CREATOR" | "STUDIO";

// Map DB tier suffixes (after `plan_` prefix) to display names.
// Tier values come from prisma/seed.ts → plan_free, plan_beginner,
// plan_basic, plan_pro, plan_elite (+ _3month variants which collapse
// to the same display tier).
const TIER_DISPLAY_MAP: Record<string, DisplayPlan> = {
  FREE: "FREE",
  BEGINNER: "BEGINNER",
  BASIC: "STARTER",
  PRO: "CREATOR",
  ELITE: "STUDIO",
};

/**
 * Pure mapping from a DB `SubscriptionTier.tier` value to the user-visible
 * display label. Exported for testability and reuse outside the React tree.
 *
 * Returns "FREE" as a safe fallback for unknown values.
 */
export function resolveDisplayPlan(planTier?: string): DisplayPlan {
  if (!planTier) return "FREE";
  const rawKey = planTier.split("_")[1]?.toUpperCase() ?? "FREE";
  return TIER_DISPLAY_MAP[rawKey] || "FREE";
}

export const PlanLabel = ({ plan }: { plan?: string }) => {
  const displayPlan = resolveDisplayPlan(plan);

  const planInfo: Record<DisplayPlan, { icon: JSX.Element; emoji: string }> = {
    FREE: { icon: <Star className="inline h-4 w-4 mr-1 text-yellow-400" />, emoji: "✨" },
    BEGINNER: { icon: <Sparkles className="inline h-4 w-4 mr-1 text-emerald-400" />, emoji: "🌱" },
    STARTER: { icon: <Star className="inline h-4 w-4 mr-1 text-yellow-400" />, emoji: "⭐" },
    CREATOR: { icon: <Shield className="inline h-4 w-4 mr-1 text-blue-500" />, emoji: "🛡️" },
    STUDIO: { icon: <Crown className="inline h-4 w-4 mr-1 text-purple-600" />, emoji: "👑" },
  };

  const { icon, emoji } = planInfo[displayPlan];

  return (
    <span className="inline-flex items-center">
      {icon} {displayPlan}
    </span>
  );
}
