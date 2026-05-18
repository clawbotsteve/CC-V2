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
  runReplicateJobSync,
  extractReplicateImageUrls,
  submitReplicateTraining,
  getReplicateLatestVersion,
} from "./replicate-client";
import { fal } from "@fal-ai/client";

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
  // Kling 2.6 pro / standard — Replicate has kwaivgi/kling-v2.1 as the
  // current generation. Maps to the closest equivalent on Replicate;
  // input shape is translated in translateFalInputToReplicate.
  // Use the v2.6 slug to match what FAL exposes (was incorrectly
  // mapped to v2.1 in earlier PRs — v2.1 worked but our UI advertises
  // Kling 2.6 to users and the model has different capabilities,
  // notably native audio generation. Verified via Replicate API
  // 2026-05-10: kwaivgi/kling-v2.6 is the current Pro tier slug).
  "fal-ai/kling-video/v2.6/pro/image-to-video": "kwaivgi/kling-v2.6",
  "fal-ai/kling-video/v2.6/standard/image-to-video": "kwaivgi/kling-v2.6",
  // Kling 3.0 — Replicate-only (no FAL endpoint exists). Using a
  // synthetic "fal-ai/kling-video/v3/image-to-video" string as the
  // logical name in our codebase so it slots into the same mapping
  // architecture. If FAL ever adds Kling 3.0 we change this one line.
  "fal-ai/kling-video/v3/image-to-video": "kwaivgi/kling-v3-video",
  // Kling Motion Control IS on Replicate (verified 2026-05-10 by
  // searching their catalogue — kwaivgi/kling-v2.6-motion-control is
  // the v2.6 line, and they also have a v3 if we want to upgrade).
  "fal-ai/kling-video/v2.6/standard/motion-control": "kwaivgi/kling-v2.6-motion-control",
  "fal-ai/bytedance/seedance/v1/pro/reference-to-video": "bytedance/seedance-1-pro",
  "fal-ai/bytedance/seedance-2.0/reference-to-video": "bytedance/seedance-1-pro",
  "fal-ai/bytedance/seedance/v1/pro/fast/image-to-video": "bytedance/seedance-1-pro",
  // Seedance 2.0 TEXT-to-video (native audio + dialogue). NOTE: this
  // model's safety layer hard-blocks any human-likeness IMAGE input
  // (verified E005 across first-frame `image` AND `reference_images`,
  // any face, prompt-independent). So this path is TEXT-ONLY — the
  // creator is described via a persona prompt + locked seed for
  // cross-render consistency. Used for the Ad Studio talking-hook.
  "fal-ai/bytedance/seedance-2.0/text-to-video": "bytedance/seedance-2.0",
  "fal-ai/veo3.1/fast/image-to-video": "google/veo-3-fast",
  "fal-ai/wan-pro/image-to-video": "wavespeedai/wan-2.2-i2v-a14b",

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
  //   lora_weights: string (HF path OR an arbitrary .safetensors URL;
  //                    our S3-mirrored trained LoRA URLs work directly.
  //                    Verified against Replicate README/schema
  //                    2026-05-17. NOT `hf_lora` — that's the community
  //                    lucataco/flux-dev-lora model, not BFL's.)
  //   lora_scale: 0-1
  //   num_inference_steps: int
  //   guidance: number
  //   aspect_ratio: similar enum to nano-banana-2
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/flux-lora" || falEndpoint === "fal-ai/flux-pro/v1.1") {
    // FAL's lora input shape: loras: [{ path, scale }]. The mapped
    // Replicate model black-forest-labs/flux-dev-lora takes the
    // weights via `lora_weights` (a HF path OR an arbitrary
    // .safetensors URL — incl. our S3-mirrored trained LoRAs). NOTE:
    // `hf_lora` is the param name for the *community* lucataco model,
    // not the BFL model we map to — sending hf_lora here is silently
    // ignored and produces a non-personalized image.
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
      out.lora_weights = firstLora.path;
      out.lora_scale = firstLora.scale ?? 1;
    }
    if (typeof falInput.seed === "number") out.seed = falInput.seed;
    return out;
  }

  // --------------------------------------------------------------
  // kwaivgi/kling-v2.6 on Replicate (Kling 2.6 Pro image-to-video)
  // Replicate input schema (verified via API 2026-05-10):
  //   prompt: string
  //   start_image: string (URL) — required for image-to-video
  //   duration: 5 | 10
  //   aspect_ratio: "16:9" | "9:16" | "1:1"
  //     (ignored if start_image is provided — model infers from image)
  //   generate_audio: boolean — native audio gen, new in v2.6
  //   negative_prompt?: string
  //
  // Notable diff from v2.1 (what we previously mapped to):
  //   - cfg_scale REMOVED — model now picks internally. We drop the
  //     field if the caller passed it.
  //   - generate_audio ADDED — wired through from the FAL input so
  //     the UI's "audio on/off" toggle keeps working.
  // --------------------------------------------------------------
  if (
    falEndpoint === "fal-ai/kling-video/v2.6/pro/image-to-video" ||
    falEndpoint === "fal-ai/kling-video/v2.6/standard/image-to-video"
  ) {
    const out: Record<string, any> = {
      prompt: falInput.prompt,
      start_image: falInput.image_url,
      duration: Number(falInput.duration) || 5,
      aspect_ratio: falInput.aspect_ratio ?? "16:9",
      // FAL's video route already coerces this to a boolean — default
      // true if undefined, matches the UI default.
      generate_audio: falInput.generate_audio !== false,
    };
    if (falInput.negative_prompt) out.negative_prompt = falInput.negative_prompt;
    // cfg_scale intentionally dropped — not supported on v2.6.
    return out;
  }

  // --------------------------------------------------------------
  // kwaivgi/kling-v3-video on Replicate (Kling 3.0)
  // Schema verified 2026-05-14 via Replicate API:
  //   prompt: string (max 2500 chars)
  //   duration: int (1-15)
  //   mode: "standard" | "pro" | "4k"
  //   start_image?: string  (first frame; aspect ratio inferred)
  //   end_image?: string    (last frame; requires start_image)
  //   aspect_ratio?: enum   (ignored when start_image is provided)
  //   multi_prompt?: string (JSON for multi-shot mode)
  //   generate_audio?: boolean
  //   negative_prompt?: string
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/kling-video/v3/image-to-video") {
    const out: Record<string, any> = {
      prompt: falInput.prompt,
      // Default mode "pro" (1080p) when not specified — matches the
      // Kling 2.6 pricing tier most users are coming from. The picker
      // can override to "standard" (cheaper) or "4k" (premium).
      mode: falInput.mode || "pro",
      duration: Number(falInput.duration) || 5,
    };
    if (falInput.image_url) out.start_image = falInput.image_url;
    if (falInput.end_image_url) out.end_image = falInput.end_image_url;
    if (!falInput.image_url && falInput.aspect_ratio) {
      out.aspect_ratio = falInput.aspect_ratio;
    }
    if (falInput.multi_prompt) out.multi_prompt = falInput.multi_prompt;
    if (typeof falInput.generate_audio === "boolean") {
      out.generate_audio = falInput.generate_audio;
    }
    if (falInput.negative_prompt) out.negative_prompt = falInput.negative_prompt;
    return out;
  }

  // --------------------------------------------------------------
  // kwaivgi/kling-v2.6-motion-control on Replicate
  // Replicate input schema (verified 2026-05-10 via their API):
  //   image: string   (reference character image URL)
  //   video: string   (reference motion video URL)
  //   prompt?: string
  //   keep_original_sound?: boolean
  //   character_orientation: "image" | "video"
  //   mode: "std" | "pro"   (cost vs quality knob, new on Replicate)
  // Field names are renamed from FAL's image_url / video_url but the
  // semantics map 1:1.
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/kling-video/v2.6/standard/motion-control") {
    const out: Record<string, any> = {
      image: falInput.image_url,
      video: falInput.video_url,
      character_orientation: falInput.character_orientation ?? "image",
      // Default to "std" — matches FAL's "/standard/" path semantically.
      // If we later want to expose a "pro" toggle in the UI, this is
      // where it'd thread through.
      mode: "std",
    };
    if (falInput.prompt) out.prompt = falInput.prompt;
    if (typeof falInput.keep_original_sound === "boolean") {
      out.keep_original_sound = falInput.keep_original_sound;
    }
    return out;
  }

  // --------------------------------------------------------------
  // bytedance/seedance-2.0 on Replicate — TEXT-to-video w/ audio.
  // Replicate input schema (verified 2026-05-18):
  //   prompt: string  (the creator persona + scene + spoken line)
  //   seed: int        (locked per roster creator → consistent face
  //                     across renders; this is how we get a
  //                     repeatable "creator" without an image input)
  //   duration: int (default 5) | resolution ("720p") | aspect_ratio
  //   generate_audio: bool (default true) — native synced dialogue
  //   reference_images: string[] — PRODUCT-only refs, referenced in
  //     the prompt as [Image1]. Verified 2026-05-18: a person image
  //     E005-blocks (deepfake gate) but a PRODUCT image does NOT —
  //     so the spokesperson is text/seed (persona) while the user's
  //     EXACT product comes through as a reference. MUST be an
  //     https URL the model worker can fetch (http:// hangs → the
  //     caller re-hosts before passing it here).
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/bytedance/seedance-2.0/text-to-video") {
    const out: Record<string, any> = {
      prompt: falInput.prompt,
      duration: Number(falInput.duration) || 5,
      resolution: falInput.resolution ?? "720p",
      aspect_ratio: falInput.aspect_ratio ?? "9:16",
      generate_audio: falInput.generate_audio !== false,
    };
    if (typeof falInput.seed === "number") out.seed = falInput.seed;
    if (
      Array.isArray(falInput.reference_images) &&
      falInput.reference_images.length > 0
    ) {
      out.reference_images = falInput.reference_images;
    }
    return out;
  }

  // --------------------------------------------------------------
  // bytedance/seedance-1-pro on Replicate
  // Used for both v1/pro/reference-to-video, v2.0/reference-to-video,
  // and v1/pro/fast/image-to-video FAL endpoints (Replicate hosts
  // one Seedance model).
  // Replicate input schema:
  //   prompt: string
  //   image: string (URL) — optional, for image-to-video
  //   duration: 5 | 10
  //   resolution: "480p" | "720p" | "1080p"
  //   aspect_ratio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4"
  //   fps: number (default 24)
  // --------------------------------------------------------------
  if (
    falEndpoint === "fal-ai/bytedance/seedance/v1/pro/reference-to-video" ||
    falEndpoint === "fal-ai/bytedance/seedance-2.0/reference-to-video" ||
    falEndpoint === "fal-ai/bytedance/seedance/v1/pro/fast/image-to-video"
  ) {
    // FAL's reference flow uses image_urls (array); image-to-video
    // uses image_url (single). Replicate wants a single image string.
    const refImage =
      (Array.isArray(falInput.image_urls) && falInput.image_urls[0]) ||
      falInput.image_url ||
      undefined;

    const out: Record<string, any> = {
      prompt: falInput.prompt,
      duration: Number(falInput.duration) || 5,
      resolution: falInput.resolution ?? "720p",
    };
    if (refImage) out.image = refImage;
    if (falInput.aspect_ratio) out.aspect_ratio = falInput.aspect_ratio;
    return out;
  }

  // --------------------------------------------------------------
  // google/veo-3-fast on Replicate
  // Schema (https://replicate.com/google/veo-3-fast):
  //   prompt: string
  //   image?: string (URL)
  //   duration: "4s" | "6s" | "8s"
  //   aspect_ratio: "16:9" | "9:16" | "auto"
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/veo3.1/fast/image-to-video") {
    return {
      prompt: falInput.prompt,
      image: falInput.image_url,
      duration: falInput.duration ?? "8s",
      aspect_ratio: falInput.aspect_ratio ?? "auto",
    };
  }

  // --------------------------------------------------------------
  // wavespeedai/wan-2.2-i2v-a14b on Replicate (Wan image-to-video)
  // --------------------------------------------------------------
  if (falEndpoint === "fal-ai/wan-pro/image-to-video") {
    return {
      prompt: falInput.prompt,
      image: falInput.image_url,
      aspect_ratio: falInput.aspect_ratio ?? "16:9",
    };
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
    // Generic webhook-URL rewriter — flips /api/webhook/{kind} →
    // /api/webhook/replicate/{kind} so each tool's webhook stays
    // separated (image webhook updates GeneratedImage, video webhook
    // updates GeneratedVideo, etc.). Each Replicate webhook handler
    // lives at the parallel path.
    const replicateWebhook = options.webhookUrl.replace(
      /\/api\/webhook\/(image|video|train|image-upscale|face-enhance|face-swap)\b/,
      "/api/webhook/replicate/$1",
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

/**
 * Submit a LoRA training job. Routes to FAL's flux-lora-fast-training
 * (the legacy path) or Replicate's ostris/flux-dev-lora-trainer based
 * on IMAGE_PROVIDER. Returns { request_id } in both cases.
 *
 * Replicate path mechanics differ from predictions — see
 * submitReplicateTraining for the full notes. Caller-visible
 * contract is identical: pass a public URL to the training ZIP, get
 * back a request_id we key the DB row on.
 */
export async function submitTrainingJob(
  falEndpoint: string,
  options: { input: any; webhookUrl: string },
): Promise<{ request_id: string }> {
  const provider = getImageProvider();

  if (provider === "replicate") {
    const replicateModel = falToReplicateModel(falEndpoint);
    if (!replicateModel) {
      console.warn(
        `[IMAGE PROVIDER] No Replicate mapping for training endpoint "${falEndpoint}", falling back to FAL.`,
      );
      // No clean fallback here — FAL is presumably locked. We surface
      // the error so the caller can mark the training failed.
      throw new Error(`No Replicate mapping for "${falEndpoint}"`);
    }

    // Translate the input shape. The trainer model wants:
    //   input_images:  string (URL to training ZIP)
    //   trigger_word:  string
    //   steps:         number
    //   plus optional knobs (autocaption, lora_rank, etc.)
    const replicateInput: Record<string, unknown> = {
      input_images: options.input.images_data_url,
      steps: options.input.steps ?? 1000,
      autocaption: true,
    };
    if (options.input.trigger_word) {
      replicateInput.trigger_word = options.input.trigger_word;
    }
    if (typeof options.input.learning_rate === "number") {
      replicateInput.learning_rate = options.input.learning_rate;
    }

    // Resolve the trainer's latest version. Done dynamically (rather
    // than hardcoded) so we automatically track upstream updates.
    // Cached implicitly via the HTTP layer; one extra round-trip per
    // training submission is fine (training is a rare action).
    const version = await getReplicateLatestVersion(replicateModel);

    const replicateWebhook = options.webhookUrl.replace(
      /\/api\/webhook\/(image|video|train|image-upscale|face-enhance|face-swap)\b/,
      "/api/webhook/replicate/$1",
    );

    console.log(
      `[IMAGE PROVIDER] Replicate training → ${replicateModel}:${version.slice(0, 8)}`,
    );
    return submitReplicateTraining(replicateModel, version, replicateInput, {
      webhookUrl: replicateWebhook,
    });
  }

  // FAL path (current behavior, preserved by default).
  const resp = await submitFalJob(falEndpoint, options);
  return { request_id: resp.request_id };
}

/**
 * Synchronous image gen — blocks until the model returns or fails.
 * Equivalent to fal.subscribe() on FAL or our new Replicate
 * `runReplicateJobSync` wrapper. Returns the resulting image URL
 * (first image if multiple) and the raw provider response.
 *
 * Used by Character Studio Step 2 (the reference-image flow) where
 * the wizard wants a result inline rather than via webhook + poll.
 *
 * Returns `{ imageUrl, raw }` so callers that need additional fields
 * from the response (logs, metrics, etc.) can dig in.
 */
export async function runImageJobSync(
  falEndpoint: string,
  input: Record<string, any>,
): Promise<{ imageUrl: string; raw: any }> {
  const provider = getImageProvider();

  if (provider === "replicate") {
    const replicateModel = falToReplicateModel(falEndpoint);
    if (!replicateModel) {
      throw new Error(
        `runImageJobSync: no Replicate mapping for "${falEndpoint}". Add it to FAL_TO_REPLICATE_MODEL_MAP.`,
      );
    }
    const replicateInput = translateFalInputToReplicate(falEndpoint, input);
    const result = await runReplicateJobSync(replicateModel, replicateInput);
    if (result.status !== "succeeded") {
      throw new Error(
        `Replicate prediction failed (status=${result.status}): ${String(result.error || "unknown").slice(0, 200)}`,
      );
    }
    const urls = extractReplicateImageUrls(result.output);
    const imageUrl = urls[0] || "";
    return { imageUrl, raw: result };
  }

  // FAL path — fal.subscribe() blocks until completion.
  const result = await fal.subscribe(falEndpoint, { input, logs: false });
  const r = result as any;
  // Defensive multi-path URL extraction matches the existing
  // image-tool status route — different models return URLs in
  // different shapes.
  const imageUrl =
    r?.data?.images?.[0]?.url ||
    r?.data?.images?.[0]?.image_url ||
    r?.data?.image?.url ||
    r?.images?.[0]?.url ||
    r?.images?.[0]?.image_url ||
    r?.image?.url ||
    r?.output?.images?.[0]?.url ||
    r?.payload?.images?.[0]?.url ||
    "";
  return { imageUrl, raw: result };
}
