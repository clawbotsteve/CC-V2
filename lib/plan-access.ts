export type AccessTier = "free" | "starter" | "creator" | "studio";

function normalizeTier(raw?: string | null): string {
  return (raw || "").toLowerCase();
}

export function resolveAccessTier(planTier?: string | null): AccessTier {
  const t = normalizeTier(planTier);
  if (t.includes("elite") || t.includes("studio")) return "studio";
  if (t.includes("pro") || t.includes("creator")) return "creator";
  if (t.includes("basic") || t.includes("starter")) return "starter";
  return "free";
}

export function canUseImageModel(access: AccessTier, model?: string): boolean {
  if (!model) return false;
  const isNanoPro = model === "fal-ai/nano-banana-pro";
  const isNanoEdit = model === "fal-ai/nano-banana-2/edit";

  if (access === "free") return isNanoPro;
  if (access === "starter") return isNanoPro || model === "fal-ai/nano-banana-2";
  if (access === "creator") return model !== "soul-2" && model !== "higgsfield-ai/soul";
  return true;
}

export function canUseVideoModel(access: AccessTier, model?: string): boolean {
  if (!model) return false;
  if (access === "free") return false;
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
  if (model === "fal-ai/nano-banana-pro") return "Free";
  if (model === "fal-ai/nano-banana-2") return "Starter";
  if (model === "fal-ai/nano-banana-2/edit") return "Creator";
  return "Creator";
}
