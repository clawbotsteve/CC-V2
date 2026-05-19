/**
 * Talking-video (WaveSpeed Seedance-2 i2v) pricing — the SINGLE
 * source of truth for both the API charge and the UI credit display
 * so they can never drift.
 *
 * Cost basis: WaveSpeed 720p i2v ≈ ~$0.25/sec (conservative).
 * Credit value ≈ ~$0.067 (Brand plan, $399 / 6000cr). At 15 cr/sec
 * that's ~$1/sec billed vs ~$0.25 cost → ~4× on variable cost =
 * healthy margin even if WaveSpeed is pricier than estimated or the
 * user is on a cheaper tier. Variants are seeded per tier in
 * constants/pricing-constants.ts (wavespeed_talk_{5,10,15}s).
 */

export const TALKING_DURATIONS = [5, 10, 15] as const;
export type TalkingDuration = (typeof TALKING_DURATIONS)[number];

const CREDITS: Record<TalkingDuration, number> = {
  5: 75,
  10: 150,
  15: 225,
};

/** Snap any input to the nearest supported duration (5/10/15). */
export function normalizeTalkingDuration(sec: unknown): TalkingDuration {
  const n = Number(sec);
  if (n >= 13) return 15;
  if (n >= 8) return 10;
  return 5;
}

export function talkingVariant(sec: unknown): string {
  return `wavespeed_talk_${normalizeTalkingDuration(sec)}s`;
}

export function talkingCredits(sec: unknown): number {
  return CREDITS[normalizeTalkingDuration(sec)];
}
