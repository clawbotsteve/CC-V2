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
 * Image-model access rules (revised 2026-05-01):
 *   Free      → gpt-image-2 only (medium-quality only, locked server-side)
 *   Beginner  → all 4 picker models (gpt-image-2 medium-only,
 *               nano-banana-2 + edit capped at 2K, flux-lora 1K)
 *   Starter+  → all 4 picker models, no quality caps
 *   Creator   → also Soul 2.0
 *   Studio    → everything
 *
 * Quality / resolution clamping for Beginner happens in
 * /api/tools/image (server-side); the UI also hides high-quality
 * options when the user is on Free or Beginner.
 */
export function canUseImageModel(access: AccessTier, model?: string): boolean {
  if (!model) return false;

  if (access === "free") return model === M.GPT_IMAGE_2;

  if (access === "beginner") return STARTER_PLUS_IMAGE_MODELS.includes(model);

  if (access === "starter") return STARTER_PLUS_IMAGE_MODELS.includes(model);

  if (access === "creator") {
    return STARTER_PLUS_IMAGE_MODELS.includes(model) || model === M.SOUL_2;
  }

  // studio: all
  return true;
}

/**
 * Video-model access rules (2026-04-29):
 *   Free / Beginner → no video
 *   Starter         → Kling 2.6 only
 *   Creator+        → Kling 2.6, Kling Motion Control, Seedance 2.0 ref-to-video
 *   Studio          → all (incl. legacy Veo / Bytedance for historical compatibility)
 */
export function canUseVideoModel(access: AccessTier, model?: string): boolean {
  if (!model) return false;
  if (access === "free" || access === "beginner") return false;

  if (access === "starter") {
    return model === "kling";
  }

  if (access === "creator") {
    return (
      model === "kling" ||
      model === "kling-motion-control" ||
      model === "kling-v3" ||
      model === "seedance-2-ref"
    );
  }

  // studio: all (incl. deprecated entries kept for historical access)
  return true;
}

export function canUseUpscaleModel(access: AccessTier, model?: string): boolean {
  if (access === "studio" || access === "creator") return true;
  if (access === "starter") return model === "fal-ai/topaz/upscale/image";
  return false;
}

export function requiredPlanForVideoModel(model?: string): string {
  if (model === "kling-motion-control") return "Creator";
  if (model === "kling-v3") return "Creator";
  if (model === "seedance-2-ref") return "Creator";
  if (model === "veo") return "Studio";
  return "Starter";
}

/**
 * Character Studio (the guided AI-character builder) is gated to
 * Creator+ for the MVP. The flow burns ~30 generations per character
 * (1 base ref + 6 variations + 15 prompt-pack + LoRA training) so
 * Free / Beginner / Starter would chew through their monthly credits
 * in a single character. Revisit once we have ad-hoc credit packs.
 */
export function canUseCharacterStudio(access: AccessTier): boolean {
  return access === "creator" || access === "studio";
}

export function requiredPlanForCharacterStudio(): string {
  return "Creator";
}

export function requiredPlanForImageModel(model?: string): string {
  // gpt-image-2 is the only model Free can use; "Free" is what the picker
  // labels it with so users on Free don't see an "upgrade required" badge
  // for the model that actually works for them.
  if (model === M.GPT_IMAGE_2) return "Free";
  // Beginner unlocks all 4 picker models (revised 2026-05-01) — quality is
  // capped (medium / 2K) for Beginner via server-side clamps in
  // /api/tools/image, but model access itself is gated at Beginner.
  if (model === M.NANO_BANANA_2 || model === M.NANO_BANANA_2_EDIT) return "Beginner";
  if (model === M.FLUX_LORA) return "Beginner";
  if (model === M.SOUL_2) return "Creator";
  // Deprecated picker entries still default to Starter for messaging.
  return "Starter";
}
