export type AccessTier = "free" | "beginner" | "starter" | "creator" | "studio";

function normalizeTier(raw?: string | null): string {
  return (raw || "").toLowerCase();
}

/**
 * Map a DB SubscriptionTier.tier value → AccessTier.
 *
 * Order of checks matters: more specific names first because some terms
 * overlap (e.g. "plan_basic" contains "basic" but we want it to map to
 * "starter", not fall through).
 */
export function resolveAccessTier(planTier?: string | null): AccessTier {
  const t = normalizeTier(planTier);
  if (t.includes("elite") || t.includes("studio")) return "studio";
  if (t.includes("pro") || t.includes("creator")) return "creator";
  if (t.includes("basic") || t.includes("starter")) return "starter";
  if (t.includes("beginner")) return "beginner";
  return "free";
}

// FAL endpoint constants — kept here so we can reference exact values
// in both the access check and the picker UI.
const M = {
  GPT_IMAGE_2: "fal-ai/gpt-image-2",
  NANO_BANANA_2: "fal-ai/nano-banana-2",
  NANO_BANANA_2_EDIT: "fal-ai/nano-banana-2/edit",
  FLUX_LORA: "fal-ai/flux-lora",
  // Deprecated — still listed so existing DB rows + admin overrides resolve cleanly.
  NANO_BANANA_PRO: "fal-ai/nano-banana-pro",
  FLUX_V1: "fal-ai/flux-pro/v1.1",
  SOUL_2: "higgsfield-ai/soul/reference",
} as const;

const STARTER_PLUS_IMAGE_MODELS: readonly string[] = [
  M.GPT_IMAGE_2,
  M.NANO_BANANA_2,
  M.NANO_BANANA_2_EDIT,
  M.FLUX_LORA,
  // Deprecated picker entries that should still validate for legacy clients
  M.NANO_BANANA_PRO,
  M.FLUX_V1,
];

/**
 * Image-model access rules (2026-04-29):
 *   Free      → gpt-image-2 only (1 credit / month → effectively a single trial gen)
 *   Beginner  → gpt-image-2 only
 *   Starter+  → gpt-image-2, nano-banana-2 (+ edit), flux-lora
 *   Creator   → also Soul 2.0
 *   Studio    → everything
 */
export function canUseImageModel(access: AccessTier, model?: string): boolean {
  if (!model) return false;

  if (access === "free") return model === M.GPT_IMAGE_2;

  if (access === "beginner") return model === M.GPT_IMAGE_2;

  if (access === "starter") return STARTER_PLUS_IMAGE_MODELS.includes(model);

  if (access === "creator") {
    return STARTER_PLUS_IMAGE_MODELS.includes(model) || model === M.SOUL_2;
  }

  // studio: all
  return true;
}

export function canUseVideoModel(access: AccessTier, model?: string): boolean {
  if (!model) return false;
  if (access === "free" || access === "beginner") return false;
  if (access === "starter") {
    return model === "kling";
  }
  if (access === "creator") {
    return model !== "veo";
  }
  return true;
}

export function canUseUpscaleModel(access: AccessTier, model?: string): boolean {
  if (access === "studio" || access === "creator") return true;
  if (access === "starter") return model === "fal-ai/topaz/upscale/image";
  return false;
}

export function requiredPlanForVideoModel(model?: string): string {
  if (model === "kling-motion-control") return "Creator";
  if (model === "veo") return "Studio";
  return "Starter";
}

export function requiredPlanForImageModel(model?: string): string {
  // gpt-image-2 is the only model Free can use; "Free" is what the picker
  // labels it with so users on Free don't see an "upgrade required" badge
  // for the model that actually works for them.
  if (model === M.GPT_IMAGE_2) return "Free";
  if (model === M.NANO_BANANA_2 || model === M.NANO_BANANA_2_EDIT) return "Starter";
  if (model === M.FLUX_LORA) return "Starter";
  if (model === M.SOUL_2) return "Creator";
  // Deprecated models still default to Starter for messaging.
  return "Starter";
}
