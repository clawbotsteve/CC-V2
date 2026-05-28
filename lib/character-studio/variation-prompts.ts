/**
 * The 3 variation prompts used in Step 3 of the Character Studio
 * wizard. Each prompt is run through Nano Banana 2 Edit using the
 * base reference image from Step 2, producing a consistent character
 * in 3 different poses / outfits / lighting setups.
 *
 * Trimmed 6→3 (2026-05-25, founder call): faster wizard, lower
 * credit cost, fewer chances for one job to fail and block training.
 * Trade-off: a Flux Dev LoRA trained on 3 references is more prone
 * to overfitting than one trained on 6-10 — the trained character
 * may not generalize as well to brand-new poses / styles. If output
 * quality suffers in practice, bumping back to 5 is a 2-line change
 * (restore the dropped entries from git history).
 *
 * The 3 kept were chosen for maximum diversity (the lever that
 * matters most for LoRA generalization at small dataset sizes):
 *   - Three-quarter portrait → clean face/identity anchor
 *   - Full-body standing → body proportions + full silhouette
 *   - Wildcard outdoor golden hour → different outfit + lighting
 *     (prevents the LoRA overfitting to one outfit / one studio look)
 *
 * Dropped (more redundant against the three above):
 *   - Profile silhouette (vs. three-quarter — similar face data)
 *   - Half-body action gesture (vs. three-quarter)
 *   - Close-up beauty crop (vs. three-quarter)
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
    label: "Full-body standing pose, natural daylight",
    prompt:
      "Same person from the reference image, full-body standing pose, weight on one foot in a relaxed contrapposto, hands loose at sides or one in pocket, neutral facial expression looking past camera, plain mid-gray seamless backdrop, soft natural daylight from above, simple wardrobe (well-fitted neutral basics — fitted top, simple bottoms), full head-to-toe visible in frame, photoreal proportions and clothing texture, identical face and identity to the reference image, 9:16.",
  },
  {
    number: 3,
    label: "Wildcard: outdoor golden hour",
    // Specific concrete scene > vague "pick the contrast that differs."
    // Nano Banana 2 Edit is much more reliable when we tell it what to
    // produce instead of asking it to make creative decisions. The
    // earlier prompt left too much to the model and was the only one
    // of the six that didn't reliably complete.
    prompt:
      "Same person from the reference image, now standing on a city sidewalk at golden hour, wearing a denim jacket over a cream tank top and faded blue jeans, soft warm late-afternoon sunlight from camera-right casting long shadows, candid mid-stride caught looking back over the shoulder at camera with a small natural smile, blurred warm-toned urban background (out-of-focus brick storefront, string lights), photoreal skin texture and hair backlit by the sun, identical face and identity to the reference image, 9:16.",
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
