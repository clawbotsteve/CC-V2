import { BillingPeriod, SubscriptionTier, ToolType } from "@prisma/client";

export type PlanKey =
  | "Free"
  | "Basic"
  | "Basic3Month"
  | "Pro"
  | "Pro3Month"
  | "Elite"
  | "Elite3Month";

export type PlanPack = Omit<
  SubscriptionTier,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "speed"
  | "support"
  | "status"
  | "toolCosts"
  | "userSubscriptions"
> & {
  key: PlanKey;
};

const phyziroPriceIds = {
  basic: {
    monthly: "price_1RibEpRtdu7lUaLOgoGLsBmh",
    quarterly: "price_1Rlw3DRtdu7lUaLO0C418ytH",
    devMonthly: "sub_qbG3GEdLA4BVYNx77x4Gu-",
    devQuarterly: "price_1RlvnKRwZCqRcdsrOEkwWfJz",
    phyziro: "sub_qbG3GEdLA4BVYNx77x4Gu-"
  },
  pro: {
    monthly: "price_1RibEWRtdu7lUaLOgIifRtp4",
    quarterly: "price_1Rlw3xRtdu7lUaLOqov3V34X",
    devMonthly: "sub_YK3v1ji4MBCCj42zT72WFF",
    devQuarterly: "price_1RlvoIRwZCqRcdsr1WEwKbmR",
    phyziro: "sub_YK3v1ji4MBCCj42zT72WFF"
  },
  elite: {
    monthly: "price_1RibE9Rtdu7lUaLO6uzn3KS1",
    quarterly: "price_1Rlw4kRtdu7lUaLOzWJyRiDH",
    devMonthly: "sub_u4IUIG47Z3eTyTtZpTAjb5",
    devQuarterly: "price_1Rlvp0RwZCqRcdsrRfwr05Ce",
    phyziro: "sub_u4IUIG47Z3eTyTtZpTAjb5"
  },
};


export const planPacks: Record<PlanKey, PlanPack> = {
  Free: {
    key: "Free",
    name: "Free Plan",
    tier: "plan_free",
    price: 0,
    period: "monthly" as BillingPeriod,
    creditsPerMonth: 5,
    maxAvatarCount: 0,
    devPriceId: "",
    phyziroPriceId: ""
  },

  Basic: {
    key: "Basic",
    name: "Basic Plan",
    tier: "plan_basic",
    price: 29.95,
    period: "monthly" as BillingPeriod,
    creditsPerMonth: 300,
    maxAvatarCount: 1,
    devPriceId: phyziroPriceIds.basic.devMonthly,
    phyziroPriceId: phyziroPriceIds.basic.phyziro,
  },
  Basic3Month: {
    key: "Basic3Month",
    name: "Basic Plan - 3 Month",
    tier: "plan_basic_3month",
    price: 55.95,
    period: "three_months" as BillingPeriod,
    creditsPerMonth: 300,
    maxAvatarCount: 1,
    devPriceId: phyziroPriceIds.basic.devQuarterly,
    phyziroPriceId: ""
  },

  Pro: {
    key: "Pro",
    name: "Pro Plan",
    tier: "plan_pro",
    price: 69.99,
    period: "monthly" as BillingPeriod,
    creditsPerMonth: 650,
    maxAvatarCount: 3,
    devPriceId: phyziroPriceIds.pro.devMonthly,
    phyziroPriceId: phyziroPriceIds.pro.phyziro
  },
  Pro3Month: {
    key: "Pro3Month",
    name: "Pro Plan - 3 Month",
    tier: "plan_pro_3month",
    price: 129.95,
    period: "three_months" as BillingPeriod,
    creditsPerMonth: 650,
    maxAvatarCount: 3,
    devPriceId: phyziroPriceIds.pro.devQuarterly,
    phyziroPriceId: ""
  },

  Elite: {
    key: "Elite",
    name: "Elite Plan",
    tier: "plan_elite",
    price: 129.99,
    period: "monthly" as BillingPeriod,
    creditsPerMonth: 1500,
    maxAvatarCount: 5,
    devPriceId: phyziroPriceIds.elite.devMonthly,
    phyziroPriceId: phyziroPriceIds.elite.phyziro
  },
  Elite3Month: {
    key: "Elite3Month",
    name: "Elite Plan - 3 Month",
    tier: "plan_elite_3month",
    price: 229.95,
    period: "three_months" as BillingPeriod,
    creditsPerMonth: 1500,
    maxAvatarCount: 5,
    devPriceId: phyziroPriceIds.elite.devQuarterly,
    phyziroPriceId: ""
  },
};


/**
 * Credit costs calculated with 120% profit margin per model:
 * - Image generations: $0.20 per credit
 * - Video generations: $0.07 per credit
 * 
 * Pricing Logic:
 * 1. Base credits: Calculate minimum credits needed to cover the credit value
 *    - If API cost = credit price ($0.20), charge 1 credit
 *    - If API cost = half credit price ($0.10), charge 2 credits (to cover $0.20 base)
 * 2. Apply 120% profit margin (2.2x multiplier) to get target revenue
 * 3. Calculate credits: (API_cost * 2.2) / credit_price
 * 4. Round UP (ceiling) to ensure target revenue is met or exceeded
 * 
 * Each model may have its own credit costs to maintain this margin based on their API pricing.
 * 
 * Image generation costs (all models ~$0.04/image):
 * - SFW: ($0.04 * 2.2) / $0.20 = 0.44 → 1 credit (rounded up)
 *   - User pays: $0.20, API cost: $0.04, Profit margin: 400%
 * - NSFW: Same as SFW (no additional API cost) = 1 credit
 * 
 * Video generation costs (each model maintains 120% margin at $0.07/credit):
 * - standard_5s (Kling $0.07/sec, 5s): ($0.35 * 2.2) / $0.07 = 11 credits
 *   - User pays: $0.77, API cost: $0.35, Profit margin: 120%
 * - standard_10s (Kling $0.07/sec, 10s): ($0.70 * 2.2) / $0.07 = 22 credits
 *   - User pays: $1.54, API cost: $0.70, Profit margin: 120%
 * - nsfw_5s (Bytedance $0.049/sec, 5s): ($0.245 * 2.2) / $0.07 = 7.7 → 8 credits
 *   - User pays: $0.56, API cost: $0.245, Profit margin: 129%
 * - nsfw_10s (Bytedance $0.049/sec, 10s): ($0.49 * 2.2) / $0.07 = 15.4 → 16 credits
 *   - User pays: $1.12, API cost: $0.49, Profit margin: 129%
 * - wan_720p (Wan $0.05/sec, 5s): ($0.25 * 2.2) / $0.07 = 7.857 → 8 credits
 *   - User pays: $0.56, API cost: $0.25, Profit margin: 124%
 * - veo_4s (Veo $0.40/sec, 4s): ($1.60 * 2.2) / $0.07 = 50.286 → 51 credits
 *   - User pays: $3.57, API cost: $1.60, Profit margin: 123%
 * - veo_8s (Veo $0.40/sec, 8s): ($3.20 * 2.2) / $0.07 = 100.571 → 101 credits
 *   - User pays: $7.07, API cost: $3.20, Profit margin: 121%
 * 
 * Note: All credits are rounded UP (ceiling) to ensure target revenue is met or exceeded.
 * Note: KlingMotionControl uses the same pricing as Kling (standard_5s or standard_10s based on duration)
 * 
 * Other tools:
 * - AVATAR_TO_VIDEO: Uses Kling pricing (5s) = 11 credits
 * - IMAGE_EDITOR, FACE_ENHANCE, IMAGE_UPSCALER: Fixed costs based on image processing APIs
 * - PROMPT_GENERATOR, PROMPT_OPTIMIZER: Fixed costs for AI text generation
 * - AVATAR_TRAINING: One-time setup cost (varies by tier: 65-70 credits)
 */
export const TOOL_COSTS_BY_TIER: Record<
  string,
  { tool: ToolType; variant?: string; creditCost: number }[]
> = {
  plan_free: [
    { tool: ToolType.IMAGE_GENERATOR, variant: "sfw", creditCost: 1 },
    { tool: ToolType.IMAGE_GENERATOR, variant: "nsfw", creditCost: 1 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_5s", creditCost: 11 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_5s", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_10s", creditCost: 22 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_10s", creditCost: 16 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "wan_720p", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_4s", creditCost: 51 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_8s", creditCost: 101 },
    { tool: ToolType.IMAGE_EDITOR, variant: "default", creditCost: 4 },
    { tool: ToolType.FACE_ENHANCE, variant: "default", creditCost: 5 },
    { tool: ToolType.IMAGE_UPSCALER, variant: "default", creditCost: 4 },
    { tool: ToolType.PROMPT_GENERATOR, variant: "default", creditCost: 1 },
    { tool: ToolType.PROMPT_OPTIMIZER, variant: "default", creditCost: 1 },
    { tool: ToolType.AVATAR_TO_VIDEO, variant: "5s", creditCost: 11 }, // Avatar to video 5s (Kling pricing)
    { tool: ToolType.AVATAR_TRAINING, variant: "default", creditCost: 67 }, // Avatar training one-time setup
  ],
  plan_basic: [
    { tool: ToolType.IMAGE_GENERATOR, variant: "sfw", creditCost: 1 },
    { tool: ToolType.IMAGE_GENERATOR, variant: "nsfw", creditCost: 1 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_5s", creditCost: 11 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_5s", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_10s", creditCost: 22 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_10s", creditCost: 16 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "wan_720p", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_4s", creditCost: 51 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_8s", creditCost: 101 },
    { tool: ToolType.IMAGE_EDITOR, variant: "default", creditCost: 4 },
    { tool: ToolType.FACE_ENHANCE, variant: "default", creditCost: 5 },
    { tool: ToolType.IMAGE_UPSCALER, variant: "default", creditCost: 4 },
    { tool: ToolType.PROMPT_GENERATOR, variant: "default", creditCost: 1 },
    { tool: ToolType.PROMPT_OPTIMIZER, variant: "default", creditCost: 1 },
    { tool: ToolType.AVATAR_TO_VIDEO, variant: "5s", creditCost: 11 },
    { tool: ToolType.AVATAR_TRAINING, variant: "default", creditCost: 72 },
  ],
  plan_basic_3month: [
    { tool: ToolType.IMAGE_GENERATOR, variant: "sfw", creditCost: 1 },
    { tool: ToolType.IMAGE_GENERATOR, variant: "nsfw", creditCost: 1 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_5s", creditCost: 11 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_5s", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_10s", creditCost: 22 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_10s", creditCost: 16 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "wan_720p", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_4s", creditCost: 51 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_8s", creditCost: 101 },
    { tool: ToolType.IMAGE_EDITOR, variant: "default", creditCost: 4 },
    { tool: ToolType.FACE_ENHANCE, variant: "default", creditCost: 5 },
    { tool: ToolType.IMAGE_UPSCALER, variant: "default", creditCost: 4 },
    { tool: ToolType.PROMPT_GENERATOR, variant: "default", creditCost: 1 },
    { tool: ToolType.PROMPT_OPTIMIZER, variant: "default", creditCost: 1 },
    { tool: ToolType.AVATAR_TO_VIDEO, variant: "5s", creditCost: 11 },
    { tool: ToolType.AVATAR_TRAINING, variant: "default", creditCost: 72 },
  ],
  plan_pro: [
    { tool: ToolType.IMAGE_GENERATOR, variant: "sfw", creditCost: 1 },
    { tool: ToolType.IMAGE_GENERATOR, variant: "nsfw", creditCost: 1 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_5s", creditCost: 11 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_5s", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_10s", creditCost: 22 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_10s", creditCost: 16 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "wan_720p", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_4s", creditCost: 51 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_8s", creditCost: 101 },
    { tool: ToolType.IMAGE_EDITOR, variant: "default", creditCost: 4 },
    { tool: ToolType.FACE_ENHANCE, variant: "default", creditCost: 5 },
    { tool: ToolType.IMAGE_UPSCALER, variant: "default", creditCost: 4 },
    { tool: ToolType.PROMPT_GENERATOR, variant: "default", creditCost: 1 },
    { tool: ToolType.PROMPT_OPTIMIZER, variant: "default", creditCost: 1 },
    { tool: ToolType.AVATAR_TO_VIDEO, variant: "5s", creditCost: 11 },
    { tool: ToolType.AVATAR_TRAINING, variant: "default", creditCost: 72 },
  ],
  plan_pro_3month: [
    { tool: ToolType.IMAGE_GENERATOR, variant: "sfw", creditCost: 1 },
    { tool: ToolType.IMAGE_GENERATOR, variant: "nsfw", creditCost: 1 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_5s", creditCost: 11 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_5s", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_10s", creditCost: 22 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_10s", creditCost: 16 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "wan_720p", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_4s", creditCost: 51 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_8s", creditCost: 101 },
    { tool: ToolType.IMAGE_EDITOR, variant: "default", creditCost: 4 },
    { tool: ToolType.FACE_ENHANCE, variant: "default", creditCost: 5 },
    { tool: ToolType.IMAGE_UPSCALER, variant: "default", creditCost: 4 },
    { tool: ToolType.PROMPT_GENERATOR, variant: "default", creditCost: 1 },
    { tool: ToolType.PROMPT_OPTIMIZER, variant: "default", creditCost: 1 },
    { tool: ToolType.AVATAR_TO_VIDEO, variant: "5s", creditCost: 11 },
    { tool: ToolType.AVATAR_TRAINING, variant: "default", creditCost: 72 },
  ],
  plan_elite: [
    { tool: ToolType.IMAGE_GENERATOR, variant: "sfw", creditCost: 1 },
    { tool: ToolType.IMAGE_GENERATOR, variant: "nsfw", creditCost: 1 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_5s", creditCost: 11 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_5s", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_10s", creditCost: 22 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_10s", creditCost: 16 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "wan_720p", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_4s", creditCost: 51 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_8s", creditCost: 101 },
    { tool: ToolType.IMAGE_EDITOR, variant: "default", creditCost: 4 },
    { tool: ToolType.FACE_ENHANCE, variant: "default", creditCost: 5 },
    { tool: ToolType.IMAGE_UPSCALER, variant: "default", creditCost: 4 },
    { tool: ToolType.PROMPT_GENERATOR, variant: "default", creditCost: 1 },
    { tool: ToolType.PROMPT_OPTIMIZER, variant: "default", creditCost: 1 },
    { tool: ToolType.AVATAR_TO_VIDEO, variant: "5s", creditCost: 11 },
    { tool: ToolType.AVATAR_TRAINING, variant: "default", creditCost: 72 },
  ],
  plan_elite_3month: [
    { tool: ToolType.IMAGE_GENERATOR, variant: "sfw", creditCost: 1 },
    { tool: ToolType.IMAGE_GENERATOR, variant: "nsfw", creditCost: 1 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_5s", creditCost: 11 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_5s", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "standard_10s", creditCost: 22 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "nsfw_10s", creditCost: 16 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "wan_720p", creditCost: 8 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_4s", creditCost: 51 },
    { tool: ToolType.VIDEO_GENERATOR, variant: "veo_8s", creditCost: 101 },
    { tool: ToolType.IMAGE_EDITOR, variant: "default", creditCost: 4 },
    { tool: ToolType.FACE_ENHANCE, variant: "default", creditCost: 5 },
    { tool: ToolType.IMAGE_UPSCALER, variant: "default", creditCost: 4 },
    { tool: ToolType.PROMPT_GENERATOR, variant: "default", creditCost: 1 },
    { tool: ToolType.PROMPT_OPTIMIZER, variant: "default", creditCost: 1 },
    { tool: ToolType.AVATAR_TO_VIDEO, variant: "5s", creditCost: 11 },
    { tool: ToolType.AVATAR_TRAINING, variant: "default", creditCost: 72 },
  ],
};


export const PLAN_MAPS: Record<PlanKey, {
  name: string;
  description: string;
  features: string[];
  recommended?: boolean;
}> = {
  Free: {
    name: "Free Plan",
    description: "Limited trial access. Perfect for testing the platform.",
    features: [
      "🎯 1 photo generation per month",
      "🖼️ Basic image export",
      "🔓 Platform trial access",
      "❌ No additional tools",
    ],
  },
  Basic: {
    name: "Basic Plan",
    description: "Ideal for casual creators or testing styles.",
    features: [
      "🎞️ Video generation",
      "🖼️ Photo generation",
      "👤 Influencer/model generation",
      "🎭 Avatar to video",
      "💬 Prompt generation",
      "🛠️ Image editing",
      "🔍 Image upscaling",
      "📺 HD video export",
      "🎨 Image editing tools",
      "🤖 AI prompt assistance",
      "📧 Email support",
    ],
  },
  Basic3Month: {
    name: "Basic Plan (3 month)",
    description: "Ideal for casual creators or testing styles.",
    features: [
      "🎞️ Video generation",
      "🖼️ Photo generation",
      "👤 Influencer/model generation",
      "🎭 Avatar to video",
      "💬 Prompt generation",
      "🛠️ Image editing",
      "🔍 Image upscaling",
      "📺 HD video export",
      "🎨 Image editing tools",
      "🤖 AI prompt assistance",
      "📧 Email support",
    ],
  },

  Pro: {
    name: "Pro Plan",
    description: "Designed for active users posting frequently.",
    recommended: true,
    features: [
      "✅ All Basic Plan features",
      "⚡ More generation power",
      "🚀 Optimized for consistent creators",
      "📺 HD export",
      "🧠 Advanced AI prompt tools",
      "🛠️ Full tool access",
      "⭐ Priority support",
    ],
  },
  Pro3Month: {
    name: "Pro Plan (3 month)",
    description: "Designed for active users posting frequently.",
    recommended: true,
    features: [
      "✅ All Basic Plan features",
      "⚡ More generation power",
      "🚀 Optimized for consistent creators",
      "📺 HD export",
      "🧠 Advanced AI prompt tools",
      "🛠️ Full tool access",
      "⭐ Priority support",
    ],
  },

  Elite: {
    name: "Elite Plan",
    description: "For high-volume creators or small teams.",
    features: [
      "✅ All Pro Plan features",
      "⚡ Large-scale content generation",
      "🎯 FLUX-2 high-performance avatar training",
      "🚦 Priority processing",
      "🧪 Platform beta access",
      "📺 Ultra HD export support",
      "🌟 First access to new tools",
      "💎 VIP benefits",
    ],
  },
  Elite3Month: {
    name: "Elite Plan (3 month)",
    description: "For high-volume creators or small teams.",
    features: [
      "✅ All Pro Plan features",
      "⚡ Large-scale content generation",
      "🎯 FLUX-2 high-performance avatar training",
      "🚦 Priority processing",
      "🧪 Platform beta access",
      "📺 Ultra HD export support",
      "🌟 First access to new tools",
      "💎 VIP benefits",
    ],
  }
};

export const TIER_KEY_MAP: Record<string, PlanKey> = {
  plan_free: "Free",
  plan_basic: "Basic",
  plan_basic_3month: "Basic3Month",
  plan_pro: "Pro",
  plan_pro_3month: "Pro3Month",
  plan_elite: "Elite",
  plan_elite_3month: "Elite3Month"
};
