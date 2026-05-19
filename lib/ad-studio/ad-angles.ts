/**
 * Ad Studio — UGC ad-angle prompt templates.
 *
 * Each angle is a hand-tuned Nano Banana 2 Edit prompt that fuses
 * the AI creator reference(s) + the product reference into a
 * believable UGC ad scene.
 *
 * PROMPT SAFETY NOTE (learned the hard way, 2026-05-17):
 * Nano Banana 2 is Gemini-based. Phrasing like "same person, keep
 * face and identity identical" reads to Gemini's safety classifier
 * as biometric identity preservation / deepfake and gets refused
 * with an opaque "Failed to generate image." — ESPECIALLY when the
 * creator reference is a photorealistic real human. Framing the
 * subject as "the AI UGC creator from the reference, keep their
 * look/vibe consistent" (character consistency, not identity lock)
 * passes far more reliably. Keep templates in that register. The
 * stock-creator roster references should also be AI-generated
 * faces, not real photos, for the same reason.
 *
 * These map 1:1 to the proven hook archetypes that win on paid
 * social (TikTok/Meta UGC creative):
 *   - problem/solution
 *   - testimonial / "I was skeptical"
 *   - unboxing reaction
 *   - before/after
 *   - demo / how-to
 *   - lifestyle hold (the safe default)
 *
 * Variables:
 *   {creator}  — short identity hint (name / "the woman in image 1")
 *   {product}  — short product description from the setup
 *
 * Why these exist as code (not free-text): in PR 3 we generate ~20
 * variants per product by combining angles × formats × emotions.
 * Having angles as structured data makes that combinatorial pass
 * trivial. The MVP (PR 2) just uses one angle at a time.
 */

import { productPresentation } from "./product-types";

export type AdAngleKey =
  | "lifestyle_hold"
  | "problem_solution"
  | "testimonial"
  | "unboxing"
  | "before_after"
  | "demo"
  | "virtual_tryon";

export interface AdAngle {
  key: AdAngleKey;
  label: string;
  /** One-line description shown in the picker. */
  blurb: string;
  /** 9:16 is the paid-social default; some angles read better wide. */
  aspectRatio: "9:16" | "1:1" | "4:5";
  /** {creator} + {product} get filled at request time. */
  template: string;
  /**
   * Static example thumbnail showing what this angle produces.
   * Path under /public. Conventionally /ad-angles/{key}.jpg.
   * The UI degrades gracefully (gradient + label) if the asset
   * isn't present yet, so the flow ships before the images do —
   * same pattern as the hero. Drop the 6 generated examples into
   * public/ad-angles/ to light these up.
   */
  exampleImage: string;
}

export const AD_ANGLES: AdAngle[] = [
  {
    key: "lifestyle_hold",
    exampleImage: "/ad-angles/lifestyle_hold.jpg",
    label: "Lifestyle hold",
    blurb: "Creator holding the product to camera, natural setting. The safe, high-performing default.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their overall look, hairstyle and vibe consistent and natural, {presentation}, casual authentic UGC selfie framing, soft natural window light, plain modern home interior softly blurred behind, genuine warm half-smile looking at the lens, product clearly visible and in sharp focus with its label readable, shot on a phone front camera, slight imperfection / realism (no studio polish), vertical 9:16.",
  },
  {
    key: "problem_solution",
    exampleImage: "/ad-angles/problem_solution.jpg",
    label: "Problem → solution",
    blurb: "Creator mid-explanation gesturing at the product as the fix. Highest-converting ad hook.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their look and vibe consistent and natural, caught mid-sentence talking directly to the camera with an expressive 'here's what fixed it' energy while {presentation}, casual bathroom or bedroom UGC setting softly blurred, honest direct-address energy, natural phone-camera look with realistic skin texture, product label sharp and readable, vertical 9:16.",
  },
  {
    key: "testimonial",
    exampleImage: "/ad-angles/testimonial.jpg",
    label: "Testimonial / skeptic",
    blurb: "\"I was skeptical but…\" — creator with a convinced, slightly surprised expression.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their look and vibe consistent and natural, relaxed on a sofa talking candidly to the camera with a slightly surprised, won-over expression (the 'okay I'm actually impressed' look) while {presentation}, cozy warm home lighting, authentic unpolished UGC vlog framing, product clearly visible, vertical 9:16.",
  },
  {
    key: "unboxing",
    exampleImage: "/ad-angles/unboxing.jpg",
    label: "Unboxing reaction",
    blurb: "Excited first-look reaction holding the product just out of the box.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their look and vibe consistent and natural, genuine excited 'ooh' reaction having just lifted it out of its packaging, {presentation}, packaging/box visible lower in frame, bright clean desk or kitchen counter setting, energetic authentic unboxing UGC energy, phone-camera realism, product and packaging in sharp focus, vertical 9:16.",
  },
  {
    key: "before_after",
    exampleImage: "/ad-angles/before_after.jpg",
    label: "Before / after",
    blurb: "Confident 'look at the result' pose presenting the product as the cause.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their look and vibe consistent and natural, confident glowing 'look at this result' expression while {presentation}, flattering soft beauty lighting, clean bright bathroom mirror selfie UGC framing, fresh radiant skin, product label sharp and readable, aspirational but still authentic phone-camera look, vertical 9:16.",
  },
  {
    key: "demo",
    exampleImage: "/ad-angles/demo.jpg",
    label: "Demo / how-to",
    blurb: "Creator actively using or applying the product, mid-action.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their look and vibe consistent and natural, focused engaged expression, mid-action, {presentation}, close-ish UGC framing so the product use is clearly visible, natural everyday lighting, authentic tutorial energy, product in sharp focus, vertical 9:16.",
  },
  {
    key: "virtual_tryon",
    exampleImage: "/ad-angles/virtual_tryon.jpg",
    label: "Virtual try-on",
    blurb: "Creator wearing the apparel, full-body GRWM mirror look. Best for clothing.",
    aspectRatio: "9:16",
    // Apparel-specialised: force a STANDING, FULL-BODY shot of the
    // creator actually WEARING the exact garment from the product
    // image (not holding it). GRWM/mirror aesthetic. {presentation}
    // still slots the product-type phrasing but the scene hard-locks
    // full-body try-on framing.
    template:
      "Feature the AI UGC creator from the reference image, keeping their face, hair and body consistent and natural, standing and shown FULL BODY head-to-toe, actually WEARING the exact apparel from the product image fitted naturally on them ({presentation}), a 'get ready with me' fashion-vlog moment in an aesthetic bedroom with a mirror, clothes and a slight creative mess, soft natural daylight, relaxed confident pose showing the whole outfit, authentic iPhone front-camera UGC look with natural HDR and real skin tones, no color grading, vertical 9:16.",
  },
];

export const AD_ANGLE_KEYS = AD_ANGLES.map((a) => a.key);

/**
 * Fill the template placeholders.
 *  - {presentation}: HOW the creator physically presents/uses the
 *    product (product-type aware — a hat is worn, a serum applied,
 *    etc.). Defaults to the generic "hold to camera" so behaviour is
 *    unchanged when no type is resolved.
 *  - {creator} / {product}: optional grounding text; the references
 *    carry the visual, this is just extra anchoring.
 */
export function fillAdAnglePrompt(
  angle: AdAngle,
  vars: { creator?: string; product?: string; presentation?: string },
): string {
  const filled = angle.template
    .replaceAll("{presentation}", vars.presentation || productPresentation("generic"))
    .replaceAll("{creator}", vars.creator || "the AI creator in the reference")
    .replaceAll("{product}", vars.product || "the product in the product reference");
  return `${filled} ${STILL_REALISM}`;
}

/**
 * Shared realism layer appended to every still prompt. The single
 * biggest "looks like real UGC, not an AI ad" lever (lifted from how
 * the best UGC-video prompts are structured): explicit phone-capture
 * + real skin + no filter + candid imperfect framing.
 */
const STILL_REALISM =
  "Photographed on a recent iPhone front camera (natural phone-lens look, slight wide-angle, true-to-life colours). Hyper-realistic real skin: visible pores, fine texture, faint blemishes and natural under-eye tone, soft natural shine — NOT smoothed, NOT airbrushed, no beauty filter, no CGI/3D/render look. A real lived-in room behind them with believable everyday clutter and depth (not an empty studio backdrop), natural directional window light with soft real shadows. Slightly imperfect handheld framing and focus. Looks like a genuine photo a real customer actually took on their phone — indistinguishable from authentic UGC, absolutely not an AI image or a glossy ad.";
