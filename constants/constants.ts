export const INTERNAL_DASHBOARD_TOKEN = 'yebeud7dnj3nu3immmms';

export const SAFETY_LEVELS: Record<number, string> = {
  1: "Most Strict",
  2: "Strict",
  3: "Moderate",
  4: "Permissive",
  5: "Most Permissive",
  6: "No Filter",
};


/**
 * Quality-related negative prompts to improve generation output.
 */
export const QUALITY_NEGATIVE_PROMPTS: string[] = [
  "low quality, worst quality, poor quality, pixelated",
  "deformed, distorted, disfigured",
  "bad anatomy, extra limbs, missing limbs, extra digits, extra fingers, extra toes, more than five digits, more than five fingers per hand, more than five toes per hand, more than two arms, more than two legs",
  "text, watermark, signature",
  "blurry, out of focus, unblended",
];

/**
 * Platform-wide safety negative prompt — appended to ALL generation calls.
 * This blocks NSFW, violent, hateful, and otherwise unsafe content.
 * Users CANNOT override or remove this; it is enforced at the API layer.
 */
export const PLATFORM_SAFETY_NEGATIVE_PROMPT =
  "nsfw, nude, nudity, naked, topless, bottomless, exposed genitalia, exposed breasts, exposed nipples, " +
  "sexual, sexually suggestive, erotic, pornographic, hentai, ecchi, " +
  "lingerie, underwear, bikini, swimsuit, see-through clothing, transparent clothing, wet clothing, " +
  "cleavage, upskirt, provocative pose, seductive pose, bedroom eyes, ahegao, " +
  "fetish, bondage, bdsm, " +
  "gore, blood, violence, graphic violence, dismemberment, torture, self-harm, " +
  "drug use, weapons, " +
  "child, minor, underage, loli, shota, " +
  "deepfake, real person, celebrity likeness, " +
  "hate symbol, extremist imagery, racial slur, offensive gesture, " +
  "killing, death, racism, murder, rape, kill, unalive, kkk, antisemitic, nazi";

// Legacy exports kept for backward compatibility
export const NEGATIVE_PROMPTS = QUALITY_NEGATIVE_PROMPTS;

export const NSFW_CHILD_SAFETY_PROMPTS: string[] = [
  "child, children, kid, kids, minor, underage, under 18",
  "baby, infant, toddler, small child",
  "teen, teenager, adolescent, preteen",
  "family, families, parents with kids, mother and child, father and child",
  "school, classroom, playground, student uniform, schoolgirl, schoolboy",
  "loli, shota, juvenile",
];

/**
 * Default negative prompt: quality improvements + full platform safety.
 * Applied to ALL generation calls via submitFalJob().
 */
export const DEFAULT_NEGATIVE_PROMPT = [
  ...QUALITY_NEGATIVE_PROMPTS,
  PLATFORM_SAFETY_NEGATIVE_PROMPT,
].join(", ");

/**
 * NSFW negative prompt: same as default (all NSFW is now blocked platform-wide)
 * plus additional child safety terms for extra protection.
 */
export const NSFW_NEGATIVE_PROMPT = [
  ...QUALITY_NEGATIVE_PROMPTS,
  PLATFORM_SAFETY_NEGATIVE_PROMPT,
  ...NSFW_CHILD_SAFETY_PROMPTS,
].join(", ");