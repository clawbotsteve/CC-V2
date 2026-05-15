/**
 * Bearer token guarding the internal admin / Retool dashboard webhooks
 * under /api/webhook/dashboard/*. Powers operations like setting any
 * user's credit balance, changing any user's plan tier, editing tool
 * costs, and reading bulk user/analytics data — i.e. effectively
 * superuser endpoints. Compromise of this token is equivalent to
 * full admin access.
 *
 * Sourced from the INTERNAL_DASHBOARD_TOKEN environment variable.
 *
 * **Security notes**
 * - This file is committed to source control, so we must NEVER hardcode
 *   the real token here. (It used to be hardcoded as a 20-char string;
 *   that value lives in git history forever and is considered burned —
 *   was rotated 2026-05-04.)
 * - When the env var is unset we use an unguessable per-process
 *   sentinel rather than an empty string. This guarantees an attacker
 *   sending `Authorization: Bearer ` (empty) cannot pass the
 *   `token === INTERNAL_DASHBOARD_TOKEN` check — the routes fail
 *   closed instead of fail open.
 * - Loud error log in production if the env var is missing so this
 *   doesn't degrade silently into a "no admin access works" outage
 *   without a clear cause.
 */
const _INTERNAL_DASHBOARD_TOKEN_FROM_ENV = process.env.INTERNAL_DASHBOARD_TOKEN;

if (!_INTERNAL_DASHBOARD_TOKEN_FROM_ENV && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.error(
    "[CRITICAL] INTERNAL_DASHBOARD_TOKEN env var is not set in production. " +
      "All /api/webhook/dashboard/* routes will reject every request until " +
      "this is configured in Railway and the Retool connection."
  );
}

export const INTERNAL_DASHBOARD_TOKEN: string =
  _INTERNAL_DASHBOARD_TOKEN_FROM_ENV ||
  // Sentinel value used when the env var is missing. Any real Bearer token
  // (and especially the empty string from `Authorization: Bearer `) will
  // fail to match this, which is the desired fail-closed behavior.
  "__UNCONFIGURED_INTERNAL_DASHBOARD_TOKEN__DO_NOT_USE__";

/**
 * Bump this when the Terms / Privacy Policy / AUP change in a way that
 * requires re-acceptance. Users whose `User.termsVersion` doesn't match
 * this value will be re-prompted by the attestation modal.
 *
 * Format: ISO date of the legal change. Easy to read and never collides.
 */
export const CURRENT_TERMS_VERSION = "2026-05-04";

/**
 * Per-job consent version for avatar/influencer training. Captured on
 * Influencer.consentTermsVersion at submit time. Bump when the consent
 * checkboxes themselves change wording — old trainings keep their
 * historical version on the row for audit.
 */
export const CURRENT_TRAINING_CONSENT_VERSION = "2026-05-02";

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

/**
 * Max upload size for user-supplied reference images.
 *
 * Was 10 MB hardcoded in ImageUpload — bumped to 25 MB because modern
 * phone cameras (iPhone 16 Pro, Pixel 9 Pro, Galaxy S25) routinely
 * output 12-20 MB HEIC / ProRAW shots and users were hitting the cap
 * for the Kling 2.6 / 3.0 reference photo upload.
 *
 * The server's /api/upload route allows up to 100 MB; this client-side
 * cap is the friendlier "fail fast in the browser" check. Bumping
 * only affects the picker error message + the FileUpload component's
 * drop validation — no server changes needed.
 *
 * If users start uploading 4K HDR ProRAW or RAW DSLR shots (50-80 MB)
 * we can bump again, but 25 MB covers ~99% of real phone output today.
 */
export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB