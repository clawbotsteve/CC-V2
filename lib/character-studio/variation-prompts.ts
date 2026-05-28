/**
 * The 4 variation prompts used in Step 3 of the Character Studio
 * wizard. Each prompt runs through Nano Banana 2 Edit using the base
 * reference image from Step 2, producing the same character from a
 * different angle.
 *
 * Why these four specifically (2026-05-28 redesign):
 *   Character LoRA training benefits most from FULL ANGLE COVERAGE
 *   of one subject (front / side / back / front-portrait) — much more
 *   than it does from varied poses or outfits of the same angle. The
 *   earlier "Three-quarter / Full-body / Wildcard outdoor" set under-
 *   sampled the back + profile views, which made trained LoRAs weak
 *   at generating non-front shots.
 *
 *   The Base reference (Step 2) + these 4 → 5 reference images
 *   covering 360°, which is the canonical Flux Dev LoRA training set
 *   for character likeness.
 *
 *     1. Full-body FRONT       → primary likeness anchor
 *     2. Full-body SIDE profile→ jawline, hairline, body silhouette
 *     3. Full-body BACK        → hairstyle, back proportions
 *     4. Half-body FRONT       → face/skin detail close, neutral pose
 *
 * Why concrete prompts and not "now from a different angle":
 *   Nano Banana 2 Edit is much more reliable when told exactly what
 *   to produce. Each prompt locks the wardrobe (neutral basics so the
 *   LoRA doesn't overfit to one outfit), backdrop (plain studio so
 *   nothing competes with the subject), and lighting (soft even).
 *   The only variable across the four IS the angle.
 *
 * Each variation INHERITS the subject from the base reference and
 * REPLACES the framing / angle. Nano Banana 2 Edit handles identity
 * preservation natively — we don't need to re-describe the person.
 */

export interface VariationPrompt {
  number: number;
  label: string;
  prompt: string;
  isWildcard?: boolean;
}

export const VARIATION_PROMPTS: VariationPrompt[] = [
  {
    number: 1,
    label: "Full-body front view",
    prompt:
      "Same person from the reference image, full-body standing pose facing camera straight-on, shoulders square to camera, arms relaxed at sides, weight even on both feet, neutral natural facial expression looking directly into the lens, plain light-gray seamless studio backdrop, soft even studio lighting from front and slightly above, clean simple wardrobe (well-fitted neutral solid t-shirt and simple bottoms), full head-to-toe visible in frame with a small margin around the body, photoreal proportions and skin texture, identical face and identity to the reference image, 9:16.",
  },
  {
    number: 2,
    label: "Full-body side profile",
    prompt:
      "Same person from the reference image, full-body 90-degree side profile view (body and head fully turned to face camera-right, NOT looking at camera), standing upright with weight even on both feet, arms relaxed at sides, head looking forward in true side profile so only one ear, cheek, and jawline are visible to camera, plain light-gray seamless studio backdrop, soft even studio lighting, clean simple wardrobe (the same well-fitted neutral solid t-shirt and simple bottoms as the front view), full head-to-toe visible in frame, photoreal jawline + hairline silhouette, identical body and hairstyle to the reference image, 9:16.",
  },
  {
    number: 3,
    label: "Full-body back view",
    prompt:
      "Same person from the reference image, full-body view from directly behind, person standing facing away from camera with back fully to the lens (face NOT visible), shoulders square, arms relaxed at sides, full hairstyle visible from the back, plain light-gray seamless studio backdrop, soft even studio lighting, clean simple wardrobe (the same well-fitted neutral solid t-shirt and simple bottoms), full head-to-toe visible in frame, photoreal hair texture and back proportions, identical body and hairstyle to the reference image, 9:16.",
  },
  {
    number: 4,
    label: "Front portrait close-up",
    prompt:
      "Same person from the reference image, half-body front-facing portrait framed from waist up, shoulders square to camera, looking directly into the lens with a small natural relaxed expression, soft diffused daylight from a tall window camera-left for gentle dimensional shading, plain warm-cream studio backdrop, clean simple wardrobe (light knit or solid t-shirt), shallow depth of field with sharp focus on the face, photoreal skin pore detail and catchlights in the eyes, identical face and identity to the reference image, 9:16.",
  },
];

/**
 * Convenience helper — same shape as fillNichePromptPack so the API
 * layer can iterate over both consistently. The variation prompts
 * don't take template variables, so this just maps to a uniform shape.
 */
export function getVariationPrompts(): VariationPrompt[] {
  return VARIATION_PROMPTS;
}
