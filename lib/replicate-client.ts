import Replicate from "replicate";

/**
 * Replicate client wrapper — mirrors the surface area of
 * `lib/fal-client.ts` so the rest of the codebase can switch
 * providers via a single env var without touching call sites.
 *
 * Shape parity goals:
 *   - submitReplicateJob(model, { input, webhookUrl })
 *       → returns { request_id } so callers can keep using the same
 *         requestId-keyed DB writes.
 *   - getReplicateJobStatus / getReplicateJobResult
 *       → mirror FAL's queue.status / queue.result helpers.
 *   - uploadFileToReplicate
 *       → Replicate's files API (https://replicate.com/docs/reference/http#files)
 *         is used for assets that need to be referenced by URL (training
 *         ZIPs, reference images for image-to-image, etc.). FAL's
 *         `fal.storage.upload` plays the same role.
 *
 * The Replicate model identifier format is "owner/name" or
 * "owner/name:version" — version-pinned is safer for production.
 */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export interface ReplicateSubmitOptions {
  /** Model input — shape varies per model. Passed through verbatim. */
  input: Record<string, unknown>;
  /**
   * URL Replicate will POST to when the prediction completes / errors.
   * Same role as FAL's webhookUrl. We skip the webhook on localhost
   * dev because Replicate can't reach our local server — callers fall
   * back to polling /status in that case.
   */
  webhookUrl: string;
  /**
   * Optional events filter. By default Replicate fires the webhook on
   * every state change (start, output, logs, completed). We typically
   * only want "completed" — same semantics as FAL's webhook.
   */
  webhookEventsFilter?: Array<"start" | "output" | "logs" | "completed">;
}

/**
 * Submit an async prediction job. Returns a "request_id" string in
 * the same shape FAL does so downstream code (`GeneratedImage.id =
 * requestId`, the webhook lookups, etc.) keeps working unchanged.
 *
 * The `model` arg is the full Replicate identifier:
 *   "openai/gpt-image-2"
 *   "google/nano-banana-2"
 *   "black-forest-labs/flux-1.1-pro"
 *   "kwaivgi/kling-v2.0"
 *   ...etc.
 *
 * Mapping from FAL endpoint strings to Replicate model identifiers
 * lives in lib/image-provider.ts so call sites don't have to know.
 */
export async function submitReplicateJob(
  model: string,
  options: ReplicateSubmitOptions,
): Promise<{ request_id: string }> {
  const { input, webhookUrl, webhookEventsFilter = ["completed"] } = options;

  const createOptions: Parameters<typeof replicate.predictions.create>[0] = {
    model,
    input,
  };

  // Same localhost guard as the FAL client — Replicate's webhook
  // service can't reach 127.0.0.1, so we skip the webhook entirely on
  // local dev and rely on status polling. In prod / staging the URL
  // is reachable and we wire it through.
  if (webhookUrl && !webhookUrl.includes("localhost") && !webhookUrl.includes("127.0.0.1")) {
    createOptions.webhook = webhookUrl;
    createOptions.webhook_events_filter = webhookEventsFilter;
    console.log(`[REPLICATE CLIENT] Webhook URL set: ${webhookUrl}`);
  } else {
    console.warn(
      `[REPLICATE CLIENT] Skipping webhook for local dev: ${webhookUrl}. Polling will be used.`,
    );
  }

  const prediction = await replicate.predictions.create(createOptions);
  return { request_id: prediction.id };
}

/**
 * Manual status check. Same shape as FAL's getFalJobStatus — used by
 * the polling-fallback path (Character Studio's auto-recovery for
 * stuck trainings, etc.).
 */
export async function getReplicateJobStatus(requestId: string) {
  return replicate.predictions.get(requestId);
}

/**
 * Fetch the full result for a completed prediction.
 * Replicate.predictions.get returns everything (status + output +
 * error), so this is just an alias for clarity — callers that want
 * the result vs. just the status can pick the more semantic name.
 */
export async function getReplicateJobResult(requestId: string) {
  return replicate.predictions.get(requestId);
}

/**
 * Extract image URL(s) from a Replicate prediction's output.
 * Replicate's output shape varies per model:
 *   - Some models return a string (single URL)
 *   - Some return an array of strings (multiple URLs)
 *   - Some return objects with .url() or .url field
 * This helper normalises to a string[] regardless.
 */
export function extractReplicateImageUrls(output: unknown): string[] {
  if (!output) return [];
  if (typeof output === "string") return [output];
  if (Array.isArray(output)) {
    return output
      .map((entry): string | null => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const obj = entry as { url?: unknown };
          if (typeof obj.url === "string") return obj.url;
          if (typeof obj.url === "function") {
            try {
              return String((obj as any).url());
            } catch {
              return null;
            }
          }
        }
        return null;
      })
      .filter((v): v is string => typeof v === "string" && v.length > 0);
  }
  if (typeof output === "object") {
    const obj = output as { url?: unknown };
    if (typeof obj.url === "string") return [obj.url];
  }
  return [];
}

/**
 * Upload a Blob to Replicate's files API so it can be referenced
 * by URL from a prediction's input. Mirrors FAL's fal.storage.upload.
 *
 * Replicate auto-deletes uploaded files after a few hours, which is
 * fine for our use cases (training ZIPs and reference images are
 * read once at job-submit time, not later).
 */
export async function uploadBlobToReplicate(blob: Blob): Promise<string> {
  const file = await replicate.files.create(blob);
  return file.urls.get;
}

/**
 * Same as the FAL helper — handle local /uploads/* paths by reading
 * from disk, then upload to Replicate's files API and return a
 * publicly fetchable URL. Used when we need to give Replicate a URL
 * to a user-uploaded image (reference for image-to-image, base for
 * variations, etc.).
 */
export async function uploadImageUrlToReplicate(url: string): Promise<string> {
  // Lazy-load the Node fs helpers so this module stays importable in
  // edge runtimes (where 'fs/promises' doesn't exist). Only the
  // /uploads/* branch needs them.
  if (url.startsWith("/")) {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const diskPath = join(process.cwd(), "public", url.replace(/^\//, ""));
    const buffer = await readFile(diskPath);
    const blob = new Blob([buffer], { type: contentTypeFromPath(url) });
    return uploadBlobToReplicate(blob);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch source for Replicate upload: ${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();
  return uploadBlobToReplicate(blob);
}

function contentTypeFromPath(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith(".zip")) return "application/zip";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".gif")) return "image/gif";
  if (p.endsWith(".mp4")) return "video/mp4";
  if (p.endsWith(".webm")) return "video/webm";
  if (p.endsWith(".mov")) return "video/quicktime";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
