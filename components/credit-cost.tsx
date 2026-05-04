import React from "react";
import { Sparkles } from "lucide-react";
import { ToolType } from "@prisma/client";
import { CREDIT_COSTS } from "@/constants";

interface VariantCosts {
  [variant: string]: number;
}

interface CreditCostsMap {
  [tool: string]: number | VariantCosts | null | undefined;
}

interface CreditCostProps {
  toolType: ToolType;
  creditCosts?: CreditCostsMap;
  variant?: string;
}

function fallbackCost(toolType: ToolType, variant: string): number | undefined {
  if (toolType === ToolType.IMAGE_GENERATOR) {
    if (variant === "nano_banana_2_1k") return 1;
    if (variant === "nano_banana_2_2k") return 3;
    if (variant === "nano_banana_2_4k") return 4;
    return CREDIT_COSTS.IMAGE_GENERATION;
  }

  if (toolType === ToolType.VIDEO_GENERATOR) {
    // Seedance 2.0 reference-to-video — resolution-aware variants follow
    //   seedance_v2_ref_{480p|720p|1080p}_{4..15}s
    // Cost is computed dynamically as perSec × duration. This MUST mirror
    // the server-side fallback in lib/get-credit-cost.ts; if they drift the
    // displayed cost on the Generate button won't match what the user is
    // actually charged via the webhook.
    if (variant?.startsWith("seedance_v2_ref_")) {
      const match = variant.match(/^seedance_v2_ref_(480p|720p|1080p)_(\d+)s$/);
      if (match) {
        const [, res, durStr] = match;
        const duration = Number(durStr);
        if (duration >= 4 && duration <= 15) {
          const perSec =
            res === "480p" ? CREDIT_COSTS.SEEDANCE_V2_REF_480P_PER_SEC :
            res === "720p" ? CREDIT_COSTS.SEEDANCE_V2_REF_720P_PER_SEC :
            CREDIT_COSTS.SEEDANCE_V2_REF_1080P_PER_SEC;
          return perSec * duration;
        }
      }
      // Legacy variants — kept for historical rows.
      if (variant === "seedance_v2_ref_5s") return 38;
      if (variant === "seedance_v2_ref_10s") return 76;
    }
    if (variant === "kling_audio_10s") return CREDIT_COSTS.VIDEO_10S;
    if (variant === "kling_audio_5s") return CREDIT_COSTS.VIDEO_5S_KLING;
    if (variant === "kling_silent_10s") return Math.max(1, CREDIT_COSTS.VIDEO_10S - 4);
    if (variant === "kling_silent_5s") return Math.max(1, CREDIT_COSTS.VIDEO_5S_KLING - 2);
    if (variant === "veo_8s") return CREDIT_COSTS.VEO_8S;
    if (variant === "veo_4s") return CREDIT_COSTS.VEO_4S;
    if (variant === "standard_10s" || variant === "nsfw_10s") return CREDIT_COSTS.VIDEO_10S;
    if (variant === "wan_720p") return CREDIT_COSTS.VIDEO_5S_WAN;
    if (variant === "nsfw_5s") return CREDIT_COSTS.VIDEO_5S_NSFW;
    return CREDIT_COSTS.VIDEO_5S_KLING;
  }

  if (toolType === ToolType.IMAGE_EDITOR) {
    if (variant === "face_swap") return CREDIT_COSTS.FACE_SWAP;
    return CREDIT_COSTS.IMAGE_EDITOR;
  }

  if (toolType === ToolType.IMAGE_UPSCALER) {
    if (variant === "image_upscale_topaz") return CREDIT_COSTS.TOPAZ_IMAGE_UPSCALE;
    if (variant === "image_upscale_seedvr") return CREDIT_COSTS.SEEDVR_IMAGE_UPSCALE;
    if (variant === "video_upscale_bytedance_1080p_30fps") return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_1080P_30;
    if (variant === "video_upscale_bytedance_2k_30fps") return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_2K_30;
    if (variant === "video_upscale_bytedance_4k_30fps") return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_4K_30;
    if (variant === "video_upscale_bytedance_1080p_60fps") return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_1080P_60;
    if (variant === "video_upscale_bytedance_2k_60fps") return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_2K_60;
    if (variant === "video_upscale_bytedance_4k_60fps") return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_4K_60;
    return CREDIT_COSTS.IMAGE_UPSCALE;
  }
  if (toolType === ToolType.FACE_ENHANCE) return CREDIT_COSTS.FACE_ENHANCE;
  if (toolType === ToolType.PROMPT_GENERATOR) return CREDIT_COSTS.PROMPT_GENERATION;
  if (toolType === ToolType.PROMPT_OPTIMIZER) return CREDIT_COSTS.PROMPT_OPTIMIZER;

  return undefined;
}

export function CreditCost({ toolType, creditCosts, variant = "" }: CreditCostProps) {
  const costs = creditCosts?.[toolType];
  let cost: number | undefined;

  if (typeof costs === "number") {
    cost = costs;
  } else if (costs && typeof costs === "object") {
    // Priority: exact-variant DB hit → fallback function (handles dynamic
    // patterns like seedance_v2_ref_*_*s) → "default" entry → last-resort
    // first value. The previous order skipped the fallback when costs was
    // a non-empty object, so dynamic variants returned an arbitrary cost
    // (e.g. seedance_v2_ref_720p_5s rendered as 22 because that was the
    // first value in the map).
    cost =
      costs[variant] ??
      fallbackCost(toolType, variant) ??
      costs["default"] ??
      Object.values(costs)[0];
  }

  if (cost === undefined) {
    cost = fallbackCost(toolType, variant);
  }

  if (cost === undefined) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium text-white/90">
      <Sparkles className="h-3 w-3" />
      {Number.isInteger(cost) ? cost : cost.toFixed(1)}
    </span>
  );
}
