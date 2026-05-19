import sharp from "sharp";

/**
 * Center-crop an image buffer to a true 9:16 vertical (TikTok/Reels
 * ad spec). GPT Image 2 maxes at 2:3 (0.667) — taller-cropping it to
 * 9:16 (0.5625) keeps the centered subject (validated 2026-05-18:
 * face + product survive the crop cleanly).
 *
 * Crops whichever dimension is "too wide/short" relative to 9:16,
 * always keeping the centre. No upscaling — output is a real crop.
 */
export async function cropBufferTo916(input: Buffer): Promise<Buffer> {
  const img = sharp(input, { failOn: "none" });
  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!w || !h) return input;

  const TARGET = 9 / 16; // width / height
  const current = w / h;

  let cropW = w;
  let cropH = h;
  if (current > TARGET) {
    // Too wide → trim width.
    cropW = Math.round(h * TARGET);
  } else if (current < TARGET) {
    // Too tall → trim height (rare for our inputs).
    cropH = Math.round(w / TARGET);
  } else {
    return input; // already 9:16
  }

  const left = Math.max(0, Math.floor((w - cropW) / 2));
  const top = Math.max(0, Math.floor((h - cropH) / 2));

  return sharp(input, { failOn: "none" })
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toBuffer();
}
