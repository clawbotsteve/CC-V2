/**
 * Talking-video (WaveSpeed Seedance-2 i2v) pricing — SINGLE source of
 * truth for the API charge AND the UI credit display (cannot drift).
 *
 * Real cost driver = resolution × duration (NOT aspect ratio —
 * WaveSpeed bills the same for 9:16 / 1:1 / 16:9, so aspect is a free
 * creative choice, never a price lever).
 *
 * WaveSpeed 720p i2v ≈ $0.60(5s) → $5.40(15s 1080p). Conservative
 * per-sec cost: 480p ~$0.12, 720p ~$0.24, 1080p ~$0.40. Credit value
 * ≈ ~$0.067 (Brand $399/6000cr). Credits below target ≈ 4× variable
 * cost → healthy margin on every tier. Variants seeded per tier in
 * constants/pricing-constants.ts as wavespeed_talk_{res}_{dur}s.
 */

export const TALKING_DURATIONS = [5, 10, 15] as const;
export type TalkingDuration = (typeof TALKING_DURATIONS)[number];

export const TALKING_RESOLUTIONS = ["480p", "720p", "1080p"] as const;
export type TalkingResolution = (typeof TALKING_RESOLUTIONS)[number];

// WaveSpeed supports 16:9, 9:16, 4:3, 3:4, 1:1, 21:9. We expose the
// three that matter for ad placements. Cost-neutral (no surcharge).
export const TALKING_ASPECTS = ["9:16", "1:1", "16:9"] as const;
export type TalkingAspect = (typeof TALKING_ASPECTS)[number];

// [resolution][duration] → credits. ~8 / 15 / 24 cr per second.
const CREDITS: Record<TalkingResolution, Record<TalkingDuration, number>> = {
  "480p": { 5: 40, 10: 80, 15: 120 },
  "720p": { 5: 75, 10: 150, 15: 225 },
  "1080p": { 5: 120, 10: 240, 15: 360 },
};

export function normalizeTalkingDuration(sec: unknown): TalkingDuration {
  const n = Number(sec);
  if (n >= 13) return 15;
  if (n >= 8) return 10;
  return 5;
}

export function normalizeTalkingResolution(r: unknown): TalkingResolution {
  return r === "480p" || r === "1080p" ? r : "720p";
}

export function normalizeTalkingAspect(a: unknown): TalkingAspect {
  return a === "1:1" || a === "16:9" ? a : "9:16";
}

export function talkingVariant(sec: unknown, res: unknown): string {
  return `wavespeed_talk_${normalizeTalkingResolution(res)}_${normalizeTalkingDuration(sec)}s`;
}

export function talkingCredits(sec: unknown, res: unknown): number {
  return CREDITS[normalizeTalkingResolution(res)][normalizeTalkingDuration(sec)];
}
