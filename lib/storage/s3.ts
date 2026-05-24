import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

/**
 * Server-side S3 helper for persistent file storage. Used to capture
 * artifacts that come back from third-party APIs (Replicate LoRAs,
 * future export jobs) so they survive past the provider's TTL.
 *
 * Distinct from /api/upload/route.ts which handles USER-facing file
 * uploads via multipart POST — this helper is for arbitrary URL
 * sources we want to mirror to our own bucket.
 *
 * Bucket: read from S3_UPLOAD_BUCKET env var (same bucket used by
 * /api/upload to keep ops simple).
 * Region: AWS_REGION env var.
 * Credentials: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.
 *
 * Returned URLs use the regional path-style endpoint
 * (https://{bucket}.s3.{region}.amazonaws.com/{key}) so they work
 * for any S3-compatible backend (AWS, R2, Backblaze etc.) as long
 * as the key is publicly readable.
 *
 * The bucket policy must grant s3:GetObject on the relevant prefix
 * (typically loras/* or uploads/*) so Replicate's workers / the
 * user's browser can fetch the file.
 */

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.S3_UPLOAD_BUCKET || "";

const s3 = new S3Client({
  region: REGION,
  // The endpoint is optional — set AWS_S3_ENDPOINT for R2 / Backblaze
  // S3-compatible backends. Default AWS S3 uses the regional endpoint
  // automatically when this is undefined.
  ...(process.env.AWS_S3_ENDPOINT ? { endpoint: process.env.AWS_S3_ENDPOINT } : {}),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Download a file from any public URL, then re-upload to our S3 at
 * the given key prefix. Returns the persistent S3 URL.
 *
 * Used by the LoRA-training webhook: when Replicate notifies us the
 * training finished, we fetch the .safetensors from replicate.delivery
 * (which auto-expires) and stash it on S3 so the LoRA stays usable
 * forever.
 *
 * `keyPrefix` example: "loras/abc123" → produces
 *   loras/abc123/lora.safetensors
 *
 * Throws if the source URL fetch fails or the S3 PUT fails — caller
 * decides how to handle (typically: mark the training failed and
 * surface to the user).
 */
export async function mirrorUrlToS3(
  sourceUrl: string,
  keyPrefix: string,
  fileNameHint?: string,
): Promise<string> {
  if (!BUCKET) {
    throw new Error("mirrorUrlToS3: S3_UPLOAD_BUCKET is not configured");
  }

  // 1. Download the source file. Server-side fetch — no CORS, no
  //    browser limits. Replicate's URLs work fine here.
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(
      `mirrorUrlToS3: source fetch failed ${res.status} ${res.statusText} for ${sourceUrl}`,
    );
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await res.arrayBuffer());

  // 2. Build a key. We append a UUID + the inferred filename so we
  //    can have multiple objects under the same prefix without
  //    collisions (e.g. retrains of the same character).
  const inferredName = fileNameHint
    || sourceUrl.split("/").pop()?.split("?")[0]
    || "file";
  const safeName = inferredName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${keyPrefix.replace(/\/+$/, "")}/${randomUUID()}-${safeName}`;

  // 3. PUT to S3. Note we don't set ACL: 'public-read' because modern
  //    AWS accounts default to "bucket owner enforced" ownership which
  //    disallows object ACLs entirely — public access must come from
  //    the bucket policy. Same approach the /api/upload route uses.
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  // 4. Return the regional path-style URL. Works for any S3-compatible
  //    backend as long as the bucket policy allows public reads on
  //    the prefix.
  return buildPublicUrl(key);
}

/**
 * Upload a Buffer directly to S3 at the given key. Returns the
 * persistent URL. Used by code paths that already have the file
 * contents in memory (e.g. an in-process ZIP build).
 */
export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType = "application/octet-stream",
): Promise<string> {
  if (!BUCKET) {
    throw new Error("uploadBufferToS3: S3_UPLOAD_BUCKET is not configured");
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  const endpoint = process.env.AWS_S3_ENDPOINT;
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${BUCKET}/${key}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Build the publicly-fetchable URL for an uploaded object.
 *
 * Cloudflare R2 (and most non-AWS S3-compatible backends) split the
 * S3 API endpoint from the public-read URL:
 *   - AWS_S3_ENDPOINT          → authenticated S3 API (uploads/PUTs)
 *     e.g. https://<acct>.r2.cloudflarestorage.com
 *   - AWS_S3_PUBLIC_URL_BASE   → unauthenticated public reads
 *     e.g. https://pub-xxx.r2.dev   OR   https://assets.your.domain
 *
 * Replicate's training worker fetches the LoRA via the returned URL,
 * so it MUST be the public one — not the S3 API endpoint (which
 * requires auth to read).
 *
 * For plain AWS S3 the regional path-style URL is publicly readable
 * when the bucket policy allows it, so AWS_S3_PUBLIC_URL_BASE can
 * be omitted and we fall back to the legacy regional URL.
 */
function buildPublicUrl(key: string): string {
  const publicBase = process.env.AWS_S3_PUBLIC_URL_BASE;
  if (publicBase) {
    // R2 / custom domain — the path-style URL does NOT include the
    // bucket name (R2 public URLs are bucket-rooted).
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }
  const endpoint = process.env.AWS_S3_ENDPOINT;
  if (endpoint) {
    // Legacy fallback for S3-compatible endpoints with no public URL
    // configured. Works for some backends; on R2 this won't actually
    // be publicly fetchable — operator should set AWS_S3_PUBLIC_URL_BASE.
    return `${endpoint.replace(/\/$/, "")}/${BUCKET}/${key}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Boolean for "is S3 storage configured + active." Other code can
 * check this before assuming S3 is available (e.g. fall back to
 * local storage during dev when S3 creds aren't set).
 */
export function isS3Configured(): boolean {
  return Boolean(
    process.env.UPLOAD_MODE === "s3" &&
      BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY,
  );
}
