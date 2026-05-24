/**
 * Shared helpers for Replicate LoRA training output parsing.
 *
 * Lives outside the route directories so both the webhook handler
 * (/api/webhook/replicate/train) and the manual-recovery endpoint
 * (/api/character-studio/[id]/training-status) can import it
 * without tripping Next.js App Router's "no non-route exports from
 * route files" guard.
 */

/**
 * Extract the trained-LoRA weights URL from Replicate's training
 * output payload. Shape varies slightly between trainer models —
 * try the known locations in order.
 *
 * ostris/flux-dev-lora-trainer typically returns:
 *   { weights: "https://replicate.delivery/.../lora.safetensors",
 *     version: "owner/name:abc123..." }
 *
 * Some trainers return just a string (the weights URL) or an array
 * whose first element is the URL. Handle all three.
 */
export function extractWeightsUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output[0];
    return typeof first === "string" ? first : null;
  }
  if (typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (typeof o.weights === "string") return o.weights;
    if (typeof o.url === "string") return o.url;
    if (typeof o.lora === "string") return o.lora;
  }
  return null;
}
