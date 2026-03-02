export const MAX_FREE_COUNTS = 5
export const PLAN_FREE = "plan_free"
export const PLAN_STARTER_TRIAL = "plan_starter_trial"
export const PLAN_STARTER = "plan_starter"
export const PLAN_CREATOR = "plan_creator"
export const PLAN_STUDIO = "plan_studio"

export const ReferralCredit = 50

export const PLANS = [
  {
    id: PLAN_FREE,
    name: "Free",
    price: 0,
    credits: 5,
    description: "Try 5 Nano Banana Pro images for free.",
    features: [
      "✨ 5 Free Image Generations",
      "💧 Watermarked output",
      "🔓 No credit card required",
    ],
  },
  {
    id: PLAN_STARTER_TRIAL,
    name: "Starter Trial",
    price: 0,
    credits: 50,
    description: "24-hour full access trial.",
    features: [
      "⚡ 50 Credits for 24 Hours",
      "💎 No Watermark",
      "🚀 Full Tool Access",
      "🔄 Auto-converts to Starter",
    ],
  },
  {
    id: PLAN_STARTER,
    name: "Starter",
    price: 19.99,
    credits: 200,
    description: "Casual creators posting 2-3x/week.",
    features: [
      "🪙 200 Credits / Month",
      "🔓 All Tools Unlocked",
      "👤 1 Avatar Slot",
      "⚡ Standard Processing",
    ],
  },
  {
    id: PLAN_CREATOR,
    name: "Creator",
    price: 49.99,
    credits: 600,
    recommended: true,
    description: "Daily creators & small agencies.",
    features: [
      "🪙 600 Credits / Month",
      "🔓 All Tools Unlocked",
      "👥 3 Avatar Slots",
      "🚀 Priority Processing",
    ],
  },
  {
    id: PLAN_STUDIO,
    name: "Studio",
    price: 149.99,
    credits: 2000,
    description: "Agencies and power users.",
    features: [
      "🪙 2,000 Credits / Month",
      "🔓 All Tools Unlocked",
      "yw 10 Avatar Slots",
      "🚀 Priority Processing",
      "🔌 API Access",
      "🏷️ White-label Exports",
    ],
  },
];

// Feature Credit Costs
export const CREDIT_COSTS = {
  // Cheap (1-2)
  IMAGE_GENERATION: 1,
  PROMPT_GENERATION: 1,
  PROMPT_OPTIMIZER: 1,
  FACE_ENHANCE: 2,

  // Medium (3-5)
  IMAGE_EDITOR: 3,
  IMAGE_UPSCALE: 3,
  // New tuned upscale pricing
  TOPAZ_IMAGE_UPSCALE: 1,
  SEEDVR_IMAGE_UPSCALE: 5,
  BYTEDANCE_VIDEO_UPSCALE_1080P_30: 15,
  BYTEDANCE_VIDEO_UPSCALE_2K_30: 30,
  BYTEDANCE_VIDEO_UPSCALE_4K_30: 60,
  BYTEDANCE_VIDEO_UPSCALE_1080P_60: 30,
  BYTEDANCE_VIDEO_UPSCALE_2K_60: 60,
  BYTEDANCE_VIDEO_UPSCALE_4K_60: 120,
  FACE_SWAP: 4,
  LIPSYNC_TEXT: 5,

  // Expensive (10-25)
  VIDEO_5S_KLING: 10,
  VIDEO_5S_WAN: 10,
  VIDEO_5S_NSFW: 8,
  VIDEO_10S: 20,
  LIPSYNC_AUDIO: 12,
  AVATAR_VIDEO_5S: 10,
  UGC_FACTORY: 15,

  // Premium (25-80)
  VEO_4S: 25,
  VEO_8S: 50,
  CLICK_TO_AD: 40,
  SOUL_ID: 30,
  AVATAR_TRAINING: 80,
} as const;

// production
const isDev = process.env.NODE_ENV === "development";

// Plan IDs - Mapped to Stripe Price IDs
// TODO: Replace with actual Stripe Price IDs once created
export const planToPriceId: Record<string, string> = isDev
  ? {
    "price_starter_trial_dev": PLAN_STARTER_TRIAL,
    "price_starter_dev": PLAN_STARTER,
    "price_creator_dev": PLAN_CREATOR,
    "price_studio_dev": PLAN_STUDIO,
  }
  : {
    "price_starter_trial_prod": PLAN_STARTER_TRIAL,
    "price_starter_prod": PLAN_STARTER,
    "price_creator_prod": PLAN_CREATOR,
    "price_studio_prod": PLAN_STUDIO,
  };

// Credit Packs
export const creditToPriceId: Record<string, string> = isDev
  ? {
    "pack-100": "price_pack_100_dev",
    "pack-500": "price_pack_500_dev",
    "pack-1500": "price_pack_1500_dev",
  }
  : { // production
    "pack-100": "price_pack_100_prod",
    "pack-500": "price_pack_500_prod",
    "pack-1500": "price_pack_1500_prod",
  };

export const creditPackDetails: Record<string, { name: string; credits: number; price: number }> = {
  "pack-100": { name: "100 Credits", credits: 100, price: 9.99 },
  "pack-500": { name: "500 Credits", credits: 500, price: 39.99 },
  "pack-1500": { name: "1,500 Credits", credits: 1500, price: 99.99 },
};

export const avatarImagePrompt = "A confident and charismatic digital persona standing in front of a soft gradient background, wearing modern smart-casual attire, looking directly at the camera with a warm and welcoming expression. Clean studio lighting, portrait orientation, detailed facial features, cinematic depth of field. Perfect for a professional AI-generated self-introduction video."

export const systemPromptTemplate = `
You are {{name}}, an AI influencer powered by OpenClaw — a platform designed to help creators automate content, grow their brand, and save time.

Speak confidently and warmly, like a real human introducing themselves to a new audience.
Use natural language, express personality, and keep the tone friendly and engaging.

Mention OpenClaw briefly. Your speech should feel like a 15-second social media intro video.
`.trim();

export const userPromptTemplate = `
Write a short self-introduction script (under 60 words) for an AI influencer named "{{name}}".

Description: "{{description}}"

Base it on their personality. Make it sound human, expressive, and ideal for a short talking-head video.
Mention OpenClaw once, naturally.
`.trim();

export const avatarVideoPrompt = "A realistic, portrait-style image of an expressive digital influencer speaking directly into the camera with confidence and charisma. The subject is well-lit with soft cinematic lighting, positioned in a modern, creative workspace with subtle background blur. The expression should reflect warmth, clarity, and purpose — as if delivering a self-introduction for social media or a creator platform. High quality, studio setup, natural body language, depth of field, vertical video composition."
