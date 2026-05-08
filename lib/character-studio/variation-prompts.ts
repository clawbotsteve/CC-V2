/**
 * The 6 variation prompts used in Step 3 of the Character Studio
 * wizard. Each prompt is run through Nano Banana 2 Edit using the
 * base reference image from Step 2, producing a consistent character
 * in 6 different poses / outfits / lighting setups.
 *
 * Why 6 (5 + 1 wildcard)?
 *   The LoRA training set needs ~6-10 reference images of the same
 *   character to learn likeness. Five "consistent" angles capture the
 *   character from front, three-quarter, profile, full-body, and
 *   half-body. The sixth is a deliberate wildcard (different outfit,
 *   different lighting) so the LoRA doesn't overfit to one outfit or
 *   one lighting setup. Without this the trained model produces
 *   recognizable faces but always wearing the original reference outfit.
 *
 * Each variation inherits the SUBJECT from the base reference and
 * replaces the SCENE / POSE / LIGHTING. Nano Banana 2 Edit handles
 * the identity preservation natively — we don't need to re-describe
 * the character.
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
    label: "Three-quarter portrait, soft daylight",
    prompt:
      "Same person from the reference image, three-quarter angle portrait turned 30 degrees from camera, looking softly into camera with a small natural smile, soft diffused daylight from a tall window camera-left, plain warm-cream studio backdrop, clean simple wardrobe (neutral solid t-shirt or light knit), shallow depth of field, photoreal skin pore detail, identical face and identity to the reference image, 9:16.",
  },
  {
    number: 2,
    label: "Profile silhouette, cinematic side light",
    prompt:
      "Same person from the reference image, full side profile, head turned 90 degrees from camera, single dramatic warm rim light from camera-right separating the silhouette, neutral dark gray seamless backdrop fading into shadow, simple clean dark wardrobe, eyes looking forward (not at camera), photoreal hair texture and ear/jawline detail, identical face and identity to the reference image, 9:16.",
  },
  {
    number: 3,
    label: "Full-body standing pose, natural daylight",
    prompt:
      "Same person from the reference image, full-body standing pose, weight on one foot in a relaxed contrapposto, hands loose at sides or one in pocket, neutral facial expression looking past camera, plain mid-gray seamless backdrop, soft natural daylight from above, simple wardrobe (well-fitted neutral basics — fitted top, simple bottoms), full head-to-toe visible in frame, photoreal proportions and clothing texture, identical face and identity to the reference image, 9:16.",
  },
  {
    number: 4,
    label: "Half-body action gesture, environmental light",
    prompt:
      "Same person from the reference image, half-body framing from the waist up, mid-gesture (one hand raised mid-talk or laughing slightly) caught in candid motion, looking off-camera in conversation, environmental light from a large softbox camera-right, plain off-white interior wall in soft background blur, simple casual wardrobe, shallow depth of field, photoreal skin and natural micro-expression, identical face and identity to the reference image, 9:16.",
  },
  {
    number: 5,
    label: "Close-up beauty crop, ring light",
    prompt:
      "Same person from the reference image, tight close-up beauty crop from the upper chest to just above the head, looking directly into camera with a soft confident expression, even ring-light reflected in the eyes (subtle catchlight), neutral light-gray backdrop in soft falloff behind, photoreal pore-level skin detail, eyebrows and lashes sharp, simple wardrobe (plain solid neckline only visible), beauty-editorial aesthetic, identical face and identity to the reference image, 9:16.",
  },
  {
    number: 6,
    label: "Wildcard: different outfit + different lighting",
    prompt:
      "Same person from the reference image, full reset of outfit and environment: now wearing a fully different wardrobe (different color palette, different garment type than the reference), in a different location (e.g. outdoor at golden-hour OR a darker interior with dramatic warm tungsten lighting — pick the contrast that differs most from the reference), different time of day, different overall color temperature, candid mid-action pose, photoreal skin and clothing texture, identical face and identity to the reference image, 9:16.",
    isWildcard: true,
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
