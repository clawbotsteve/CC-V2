import { Star, Shield, Crown } from "lucide-react";
import { JSX } from "react";

type PlanKey = "FREE" | "BASIC" | "PRO" | "ELITE";

export const PlanLabel = ({ plan }: { plan?: string }) => {
  const rawPlanKey = plan?.split('_')[1]?.toUpperCase() || 'FREE';

  // Narrow rawPlanKey to PlanKey, fallback to FREE if not in keys
  const planKey = ["FREE", "BASIC", "PRO", "ELITE"].includes(rawPlanKey)
    ? (rawPlanKey as PlanKey)
    : "FREE";

  const planInfo: Record<PlanKey, { icon: JSX.Element; emoji: string }> = {
    FREE: { icon: <Star className="inline h-4 w-4 mr-1 text-yellow-400" />, emoji: "✨" },
    BASIC: { icon: <Star className="inline h-4 w-4 mr-1 text-yellow-400" />, emoji: "⭐" },
    PRO: { icon: <Shield className="inline h-4 w-4 mr-1 text-blue-500" />, emoji: "🛡️" },
    ELITE: { icon: <Crown className="inline h-4 w-4 mr-1 text-purple-600" />, emoji: "👑" },
  };

  const { icon, emoji } = planInfo[planKey];

  return (
    <span className="inline-flex items-center">
      {icon} {planKey}
    </span>
  );
}
