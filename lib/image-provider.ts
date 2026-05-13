/**
 * Image-generation provider abstraction.
 *
 * Picks between FAL (lib/fal-client.ts) and Replicate
 * (lib/replicate-client.ts) at runtime based on the
 * IMAGE_PROVIDER env var. Defaults to "fal" so existing behavior is
 * preserved if nothing is set.
 *
 *   IMAGE_PROVIDER=fal        (default, current production)
 *   IMAGE_PROVIDER=replicate  (new path)
 *
 * Why an env-var flag and not a hardcoded swap:
 *   - One-character rollback if Replicate hits an issue
 *   - Lets us soak-test Replicate in staging while prod stays on FAL
 *   - Avoids deleting battle-tested FAL code we may want again later
 *
 * The two providers use DIFFERENT model identifiers. The mapping
 * lives in MODEL_MAP below — call sites pass their FAL endpoint
 * string (the existing identifier they already use), and we
 * translate to the Replicate model slug when the Replicate path is
 * selected.
 */

import {
  submitFalJob,
  getFalJobStatus,
  getFalJobResult,
  uploadImageUrlToFalStorage,
} from "./fal-client";
import {
  submitReplicateJob,
  getReplicateJobStatus,
  getReplicateJobResult,
  uploadImageUrlToReplicate,
} from "./replicate-client";

export type ImageProvider = "fal" | "replicate";

export function getImageProvider(): ImageProvider {
  const v = (process.env.IMAGE_PROVIDER || "fal").toLowerCase();
  return v === "replicate" ? "replicate" : "fal";
}

/**
 * FAL endpoint string → Replicate model identifier.
 *
 * Keep this map up to date when adding new models on either side.
 * If a FAL endpoint has no Replicate counterpart, calls fall through
 * to FAL even when IMAGE_PROVIDER=replicate is set, with a warning.
 *
 * Version pinning: Replicate slugs CAN include a ":version" suffix
 * (e.g. "owner/name:abc123") for reproducibility. We use bare slugs
 * here so we automatically track the latest official version; pin
 * to a specific version only if a model breaks compat.
 */
export const FAL_TO_REPLICATE_MODEL_MAP: Record<string, string> = {
  // Image generation
  "fal-ai/gpt-image-2": "openai/gpt-image-2",
  "fal-ai/nano-banana-2": "google/nano-banana-2",
  // Replicate's nano-banana-2 accepts a `reference_images` array, so
  // text-to-image and image-edit modes route to the same model with
  // different inputs (no separate "edit" slug). The image-tool's
  // submit code decides whether to attach references.
  "fal-ai/nano-banana-2/edit": "google/nano-banana-2",
  "fal-ai/flux-lora": "black-forest-labs/flux-dev-lora",
  "fal-ai/flux-pro/v1.1": "black-forest-labs/flux-1.1-pro",
  "fal-ai/nano-banana-pro": "google/nano-banana-2",

  // LoRA training
  "fal-ai/flux-lora-fast-training": "ostris/flux-dev-lora-trainer",

  // Video generation
  "fal-ai/kling-video/v2.6/standard/image-to-video": "kwaivgi/kling-v2.0",
  "fal-ai/bytedance/seedance/v1/pro/reference-to-video": "bytedance/seedance-1-pro",

  // Upscale
  "fal-ai/topaz/upscale/image": "topazlabs/image-upscale",
};

/**
 * Translate a FAL endpoint string to its Replicate equivalent. Returns
 * null if there's no mapping — callers should fall back to FAL.
 */
export function falToReplicateModel(falEndpoint: string): string | null {
  return FAL_TO_REPLICATE_MODEL_MAP[falEndpoint] ?? null;
}

/**
 * Unified submit. Same call signature as submitFalJob (the existing
 * codebase pattern) — routes to the active provider.
 *
 * Returns { request_id } regardless of provider so downstream
 * webhook + DB code doesn't need to know who handled the job.
 */
export async function submitImageJob(
  falEndpoint: string,
  options: { input: any; webhookUrl: string },
): Promise<{ request_id: string }> {
  const provider = getImageProvider();

  if (provider === "replicate") {
    const replicateModel = falToReplicateModel(falEndpoint);
    if (!replicateModel) {
      console.warn(
        `[IMAGE PROVIDER] No Replicate mapping for "${falEndpoint}", falling back to FAL.`,
      );
      const resp = await submitFalJob(falEndpoint, options);
      return { request_id: resp.request_id };
    }
    // Replicate uses /api/webhook/replicate/image so payload parsing
    // can branch correctly. Callers pass /api/webhook/image as the
    // FAL webhook; we swap the path here when going to Replicate.
    const replicateWebhook = options.webhookUrl.replace(
      "/api/webhook/image",
      "/api/webhook/replicate/image",
    );
    return submitReplicateJob(replicateModel, {
      ...options,
      webhookUrl: replicateWebhook,
    });
  }

  // FAL path (default)
  const resp = await submitFalJob(falEndpoint, options);
  return { request_id: resp.request_id };
}

/**
 * Unified status check. Used by manual recovery paths
 * (Character Studio's "Check status now" button etc.).
 *
 * Note: status response shapes differ between providers. Callers
 * that need structured access to the raw response should call the
 * provider-specific helpers directly. This helper exists for the
 * "did it complete?" boolean question that's common across paths.
 */
export async function getImageJobStatus(falEndpoint: string, requestId: string) {
  const provider = getImageProvider();
  if (provider === "replicate") {
    return getReplicateJobStatus(requestId);
  }
  return getFalJobStatus(falEndpoint, requestId);
}

export async function getImageJobResult(falEndpoint: string, requestId: string) {
  const provider = getImageProvider();
  if (provider === "replicate") {
    return getReplicateJobResult(requestId);
  }
  return getFalJobResult(falEndpoint, requestId);
}

/**
 * Unified storage upload. Same role as fal.storage.upload — give us
 * a publicly-fetchable URL we can pass as input to a model.
 */
export async function uploadImageUrlToProvider(url: string): Promise<string> {
  const provider = getImageProvider();
  if (provider === "replicate") {
    return uploadImageUrlToReplicate(url);
  }
  return uploadImageUrlToFalStorage(url);
}
