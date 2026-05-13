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
 * Translate a FAL-shaped input object into the shape the equivalent
 * Replicate model expects. Per-model because the input schemas diverge.
 *
 * The function is intentionally additive — when a FAL field has no
 * Replicate counterpart, we drop it silently. When Replicate needs
 * fields FAL doesn't have, we infer sensible defaults from what's
 * present.
 *
 * Centralized here so the route handlers stay clean — they keep
 * building FAL-shaped inputs the way they always have, and the
 * provider layer handles the translation when IMAGE_PROVIDER=replicate.
 */
export function translateFalInputToReplicate(
  falEndpoint: string,
  falInput: Record<string, any>,
): Record<string, any> {
  // --------------------------------------------------------------
  // openai/gpt-image-2 on Replicate
  // Replicate input schema (https://replicate.com/openai/gpt-image-2):
  //   prompt: string
  //   aspect_ratio: "1:1" | "2:3" | "3:2" (mapped from FAL's
  //                  9:16 / 16:9 / 4:5 — see below)
  //   quality: "low" | "medium" | "high" | "auto"
  //   number_of_images: 1-10
  //   output_format: "png" | "jpeg" | "webp"
  //   openai_api_key: optional (we don't pass — Replicate uses theirs)
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/gpt-image-2") {
    // FAL accepts aspect_ratio strings like "9:16", "16:9", "4:5";
    // Replicate's gpt-image-2 wrapper only accepts 1:1 / 2:3 / 3:2.
    // Map our existing inputs to the closest Replicate option so
    // existing user selections still produce something reasonable.
    const aspectMap: Record<string, string> = {
      "1:1": "1:1",
      "9:16": "2:3", // portrait → closest portrait
      "3:4": "2:3",
      "4:5": "2:3",
      "16:9": "3:2", // landscape → closest landscape
      "4:3": "3:2",
    };
    const aspect =
      (typeof falInput.aspect_ratio === "string" && aspectMap[falInput.aspect_ratio]) || "1:1";

    const out: Record<string, any> = {
      prompt: falInput.prompt,
      aspect_ratio: aspect,
      quality: falInput.quality ?? "medium",
      number_of_images: falInput.num_images ?? 1,
      output_format: falInput.output_format ?? "png",
    };
    return out;
  }

  // --------------------------------------------------------------
  // google/nano-banana-2 on Replicate
  // One slug handles both text-to-image and image-edit / fusion.
  // Replicate input schema:
  //   prompt: string
  //   image_input: string[]   (optional reference images, up to 14)
  //   output_format: "jpg" | "png"
  //   aspect_ratio: "match_input" | "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  //   ...
  // --------------------------------------------------------------
  if (
    falEndpoint === "fal-ai/nano-banana-2" ||
    falEndpoint === "fal-ai/nano-banana-2/edit" ||
    falEndpoint === "fal-ai/nano-banana-pro"
  ) {
    // FAL passes references as either image_url (single) or
    // image_urls (array). Replicate wants image_input (array).
    const refs: string[] = [];
    if (Array.isArray(falInput.image_urls)) refs.push(...falInput.image_urls);
    if (typeof falInput.image_url === "string" && falInput.image_url) refs.push(falInput.image_url);

    const out: Record<string, any> = {
      prompt: falInput.prompt,
      output_format: (falInput.output_format ?? "png").toLowerCase() === "jpg" ? "jpg" : "png",
      aspect_ratio: falInput.aspect_ratio ?? falInput.aspectRatio ?? "match_input",
    };
    if (refs.length > 0) out.image_input = refs.slice(0, 14);
    return out;
  }

  // --------------------------------------------------------------
  // black-forest-labs/flux-dev-lora on Replicate
  // Used for both /flux-lora (Travia's LoRA inference flow) and the
  // legacy /flux-pro/v1.1 endpoint. Replicate input schema:
  //   prompt: string
  //   hf_lora: string (HuggingFace LoRA URL — we may need to mirror
  //                    our trained LoRAs there, or pass FAL URLs if
  //                    Replicate can fetch them)
  //   lora_scale: 0-1
  //   num_inference_steps: int
  //   guidance: number
  //   aspect_ratio: similar enum to nano-banana-2
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/flux-lora" || falEndpoint === "fal-ai/flux-pro/v1.1") {
    // FAL's lora input shape: loras: [{ path, scale }]. Replicate
    // expects a single hf_lora string.
    const firstLora =
      Array.isArray(falInput.loras) && falInput.loras[0]
        ? falInput.loras[0]
        : null;

    const out: Record<string, any> = {
      prompt: falInput.prompt,
      num_inference_steps: falInput.num_inference_steps ?? 28,
      guidance: falInput.guidance_scale ?? 3.5,
      output_format: falInput.output_format ?? "png",
      aspect_ratio: falInput.aspect_ratio ?? "1:1",
    };
    if (firstLora?.path) {
      out.hf_lora = firstLora.path;
      out.lora_scale = firstLora.scale ?? 1;
    }
    if (typeof falInput.seed === "number") out.seed = falInput.seed;
    return out;
  }

  // Default — pass through verbatim. Lets us add new model mappings
  // without breaking existing routes that happen to use compatible
  // input shapes.
  return falInput;
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
    // Translate the FAL-shaped input the route built into the shape
    // Replicate's equivalent model expects. Centralized in
    // translateFalInputToReplicate() so route handlers stay clean.
    const replicateInput = translateFalInputToReplicate(falEndpoint, options.input);
    // Replicate uses /api/webhook/replicate/image so payload parsing
    // can branch correctly. Callers pass /api/webhook/image as the
    // FAL webhook; we swap the path here when going to Replicate.
    const replicateWebhook = options.webhookUrl.replace(
      "/api/webhook/image",
      "/api/webhook/replicate/image",
    );
    console.log(
      `[IMAGE PROVIDER] Replicate → ${replicateModel}`,
      JSON.stringify({ inputKeys: Object.keys(replicateInput) }),
    );
    return submitReplicateJob(replicateModel, {
      input: replicateInput,
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
