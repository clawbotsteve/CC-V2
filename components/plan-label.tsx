import { Star, Shield, Crown } from "lucide-react";
import { JSX } from "react";

type DisplayPlan = "FREE" | "STARTER" | "CREATOR" | "STUDIO";

// Map DB tier suffixes to display names
const TIER_DISPLAY_MAP: Record<string, DisplayPlan> = {
  FREE: "FREE",
  BASIC: "STARTER",
  PRO: "CREATOR",
  ELITE: "STUDIO",
};

export const PlanLabel = ({ plan }: { plan?: string }) => {
  const rawKey = plan?.split('_')[1]?.toUpperCase() || 'FREE';
  const displayPlan = TIER_DISPLAY_MAP[rawKey] || "FREE";

  const planInfo: Record<DisplayPlan, { icon: JSX.Element; emoji: string }> = {
    FREE: { icon: <Star className="inline h-4 w-4 mr-1 text-yellow-400" />, emoji: "✨" },
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
