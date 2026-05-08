/**
 * Fill {character} / {brand} / {product} placeholders in a prompt
 * scaffold. Pure string substitution — no LLM call. The {character}
 * description is built up-front in Step 1 of the wizard from the user's
 * inputs (name, character type, niche, description blurb) and reused
 * across all 15 prompts.
 *
 * Subsequent prompts within the same pack can use a "short character"
 * (just a name + a couple traits) instead of the full description to
 * keep prompt length manageable. The wizard passes both forms — see
 * `buildCharacterDescriptors()` below.
 */

import { NICHES, Niche, PromptScaffold } from "./prompt-scaffolds";

export interface FillVars {
  /** Full multi-trait description used in the FIRST prompt. */
  character: string;
  /** Short form (e.g. "Maya") used in prompts 2-15 to save tokens. */
  characterShort?: string;
  /** Optional brand / show / agency name. */
  brand?: string;
  /** Optional featured product / book / topic. */
  product?: string;
}

/**
 * Replace {character}, {brand}, {product} placeholders.
 * - prompt 1 uses {character} = full description.
 * - prompts 2..n use {character} = short form when provided.
 * - {brand} / {product} default to neutral fallbacks if not given so we
 *   don't ship literal "{brand}" to the image model.
 */
export function fillPromptScaffold(
  scaffold: PromptScaffold,
  vars: FillVars,
  options: { isFirst?: boolean } = {},
): string {
  const isFirst = options.isFirst ?? scaffold.number === 1;
  const character = isFirst ? vars.character : (vars.characterShort || vars.character);
  const brand = vars.brand || "the brand";
  const product = vars.product || "the product";

  return scaffold.template
    .replaceAll("{character}", character)
    .replaceAll("{brand}", brand)
    .replaceAll("{product}", product);
}

/**
 * Fill all 15 prompts for a niche. Returns an array of
 * `{ scaffold, prompt }` so the caller has both the original metadata
 * (label, aspect ratio, content type, hasText flag) and the resolved
 * prompt string ready to ship to GPT Image 2 / Nano Banana 2.
 */
export function fillNichePromptPack(
  niche: Niche,
  vars: FillVars,
): Array<{ scaffold: PromptScaffold; prompt: string }> {
  const scaffolds = NICHES[niche]?.scaffolds ?? [];
  return scaffolds.map((scaffold, idx) => ({
    scaffold,
    prompt: fillPromptScaffold(scaffold, vars, { isFirst: idx === 0 }),
  }));
}

/**
 * Build the long-form `{character}` description from the wizard inputs.
 * The first prompt uses this in full; later prompts use the short form
 * (just the name) so we don't blow GPT Image 2's token budget.
 *
 * Inputs (from Step 1 of the wizard):
 *   - name           — character's first name (required)
 *   - charType       — "female" | "male" | "animated"
 *   - description    — 1-3 sentence blurb the user wrote
 *
 * The output reads like a single noun phrase that drops naturally into
 * a prompt's `{character}` slot, e.g. "Maya, a 27-year-old fitness
 * creator with shoulder-length brown hair, athletic build, warm
 * brown eyes, [user's description]".
 */
export function buildCharacterDescriptors(args: {
  name: string;
  charType: "female" | "male" | "animated";
  description: string;
}): { character: string; characterShort: string } {
  const name = args.name.trim();
  const desc = args.description.trim();

  // Short form is just the name. Used in prompts 2..n where repeating
  // the full description per prompt would crowd out the actual scene
  // detail in the scaffold.
  const characterShort = name;

  // Long form is "{name}, {description}" — the user's blurb already
  // covers age / build / hair / eyes / vibe, so we just prepend the name.
  // If the user didn't write a description, fall back to a generic
  // descriptor based on charType so the prompt still parses.
  const fallback =
    args.charType === "animated"
      ? "an original animated character with a distinctive look"
      : args.charType === "male"
        ? "a 27-year-old man with an approachable look and natural styling"
        : "a 27-year-old woman with an approachable look and natural styling";

  const character = desc ? `${name}, ${desc}` : `${name}, ${fallback}`;

  return { character, characterShort };
}
