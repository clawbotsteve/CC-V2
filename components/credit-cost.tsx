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
    cost = costs[variant] ?? costs["default"] ?? Object.values(costs)[0];
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
