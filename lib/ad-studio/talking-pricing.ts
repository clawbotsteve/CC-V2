/**
 * Talking-video (WaveSpeed Seedance-2 i2v) pricing — SINGLE source of
 * truth for the API charge AND the UI credit display (cannot drift).
 *
 * Cost is linear in seconds and scales with resolution (NOT aspect —
 * WaveSpeed bills the same for 9:16/1:1/16:9, so aspect is free).
 * Charged as a COMPUTED amount (chargeExplicitCredits) — no discrete
 * ToolCreditCost variants, so any integer length 5–15s works.
 *
 * WaveSpeed 720p i2v ≈ ~$0.24/sec; 480p ~$0.12; 1080p ~$0.40.
 * Credit value ≈ ~$0.067 (Brand $399/6000cr). Rates below ≈ 4×
 * variable cost → healthy margin on every tier.
 */

export const TALKING_MIN_SEC = 5;
export const TALKING_MAX_SEC = 15;

export const TALKING_RESOLUTIONS = ["480p", "720p", "1080p"] as const;
export type TalkingResolution = (typeof TALKING_RESOLUTIONS)[number];

export const TALKING_ASPECTS = ["9:16", "1:1", "16:9"] as const;
export type TalkingAspect = (typeof TALKING_ASPECTS)[number];

/** Credits per second by resolution (≈ 4× WaveSpeed variable cost). */
const RATE: Record<TalkingResolution, number> = {
  "480p": 8,
  "720p": 15,
  "1080p": 24,
};

/** Clamp to an integer 5–15s (WaveSpeed Seedance-2 i2v range). */
export function normalizeTalkingDuration(sec: unknown): number {
  const n = Math.round(Number(sec));
  if (!Number.isFinite(n)) return TALKING_MIN_SEC;
  return Math.min(TALKING_MAX_SEC, Math.max(TALKING_MIN_SEC, n));
}

export function normalizeTalkingResolution(r: unknown): TalkingResolution {
  return r === "480p" || r === "1080p" ? r : "720p";
}

export function normalizeTalkingAspect(a: unknown): TalkingAspect {
  return a === "1:1" || a === "16:9" ? a : "9:16";
}

/** Computed credits for a given length + resolution. Linear. */
export function talkingCredits(sec: unknown, res: unknown): number {
  return (
    normalizeTalkingDuration(sec) *
    RATE[normalizeTalkingResolution(res)]
  );
}

/** Stable tag for the GeneratedVideo.creditVariant (analytics only —
 *  NOT a ToolCreditCost lookup; charging is computed). */
export function talkingVariant(res: unknown): string {
  return `wavespeed_talk_${normalizeTalkingResolution(res)}`;
}
