import { ToolType } from "@prisma/client";
import prismadb from "./prismadb";
import { CREDIT_COSTS } from "@/constants";

/**
 * Retrieves the credit cost of a specific tool (and optional variant)
 * for a given subscription tier.
 *
 * This function:
 * 1. Looks up the `SubscriptionTier` using the unique `tier` string (e.g., "plan_free").
 * 2. Uses the tier's internal `id` to find the corresponding `ToolCreditCost` record.
 * 3. Returns the number of credits required to use the specified tool.
 *
 * @param {Object} params - Function parameters.
 * @param {string} params.tier - The unique string identifier of the subscription tier (e.g., "plan_basic").
 * @param {ToolType} params.tool - The tool type (enum from Prisma) to retrieve the cost for.
 * @param {string} [params.variant] - Optional tool variant (e.g., "standard_10s" for videos).
 *
 * @returns {Promise<number | null>} - Returns the credit cost if found, or null if not found or tier doesn't exist.
 */

/**
 * Hardcoded fallback credit costs when DB lookup fails or tier is missing.
 * Single source of truth for fallback pricing — used by both missing-tier and missing-cost paths.
 */
function getFallbackCreditCost(tool: ToolType, variant?: string): number {
  switch (tool) {
    case ToolType.IMAGE_GENERATOR:
      switch (variant) {
        case "nano_banana_2_2k": return 3;
        case "nano_banana_2_4k": return 4;
        case "nano_banana_2_1k": return 1;
        default: return CREDIT_COSTS.IMAGE_GENERATION;
      }
    case ToolType.VIDEO_GENERATOR:
      switch (variant) {
        case "kling_audio_5s": return CREDIT_COSTS.VIDEO_5S_KLING;
        case "kling_audio_10s": return CREDIT_COSTS.VIDEO_10S;
        case "kling_silent_5s": return Math.max(1, CREDIT_COSTS.VIDEO_5S_KLING - 2);
        case "kling_silent_10s": return Math.max(1, CREDIT_COSTS.VIDEO_10S - 4);
        case "standard_5s": return CREDIT_COSTS.VIDEO_5S_KLING;
        case "wan_720p": return CREDIT_COSTS.VIDEO_5S_WAN;
        case "nsfw_5s": return CREDIT_COSTS.VIDEO_5S_NSFW;
        case "standard_10s": return CREDIT_COSTS.VIDEO_10S;
        case "nsfw_10s": return CREDIT_COSTS.VIDEO_10S;
        case "veo_4s": return CREDIT_COSTS.VEO_4S;
        case "veo_8s": return CREDIT_COSTS.VEO_8S;
        default: return CREDIT_COSTS.VIDEO_5S_KLING;
      }
    case ToolType.FACE_ENHANCE:
      return CREDIT_COSTS.FACE_ENHANCE;
    case ToolType.IMAGE_UPSCALER:
      switch (variant) {
        case "image_upscale_topaz":
          return CREDIT_COSTS.TOPAZ_IMAGE_UPSCALE;
        case "image_upscale_seedvr":
          return CREDIT_COSTS.SEEDVR_IMAGE_UPSCALE;
        case "video_upscale_bytedance_1080p_30fps":
          return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_1080P_30;
        case "video_upscale_bytedance_2k_30fps":
          return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_2K_30;
        case "video_upscale_bytedance_4k_30fps":
          return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_4K_30;
        case "video_upscale_bytedance_1080p_60fps":
          return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_1080P_60;
        case "video_upscale_bytedance_2k_60fps":
          return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_2K_60;
        case "video_upscale_bytedance_4k_60fps":
          return CREDIT_COSTS.BYTEDANCE_VIDEO_UPSCALE_4K_60;
        default:
          return CREDIT_COSTS.IMAGE_UPSCALE;
      }
    case ToolType.IMAGE_EDITOR:
      if (variant === "face_swap") return CREDIT_COSTS.FACE_SWAP;
      return CREDIT_COSTS.IMAGE_EDITOR;
    case ToolType.PROMPT_GENERATOR:
      return CREDIT_COSTS.PROMPT_GENERATION;
    case ToolType.PROMPT_OPTIMIZER:
      return CREDIT_COSTS.PROMPT_OPTIMIZER;
    default:
      return 1;
  }
}

export async function getToolCreditCost({
  tier,
  tool,
  variant,
}: {
  tier: string;
  tool: ToolType;
  variant?: string;
}): Promise<number | null> {
  console.log("[getToolCreditCost] Input:", { tier, tool, variant });

  const subscriptionTier = await prismadb.subscriptionTier.findUnique({
    where: { tier },
    select: { id: true },
  });

  if (!subscriptionTier) {
    console.warn(`[getToolCreditCost] No subscription tier found for: ${tier}. Falling back to constants.`);
    return getFallbackCreditCost(tool, variant);
  }

  console.log(`[getToolCreditCost] Found tierId: ${subscriptionTier.id}`);

  const costEntry = await prismadb.toolCreditCost.findFirst({
    where: {
      tierId: subscriptionTier.id,
      tool,
      variant: variant?.trim() === "" ? null : variant ?? null,
    },
    select: {
      creditCost: true,
    },
  });

  if (!costEntry) {
    console.warn(`[getToolCreditCost] No DB record found for: ${tool} / ${variant}. Falling back to constants.`);
    return getFallbackCreditCost(tool, variant);
  }

  console.log(`[getToolCreditCost] Found credit cost: ${costEntry.creditCost}`);
  return costEntry.creditCost;
}
