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
  /** Optional looping video preview (takes precedence over
   *  exampleImage in the picker tile). Conventionally
   *  /ad-angles/{key}.mp4. */
  exampleVideo?: string;
}

export const AD_ANGLES: AdAngle[] = [
  {
    key: "lifestyle_hold",
    exampleImage: "/ad-angles/lifestyle_hold.jpg",
    exampleVideo: "/ad-angles/ugc.mp4",
    label: "UGC",
    blurb: "Creator holding the product to camera, natural setting. The safe, high-performing default.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their overall look, hairstyle and vibe consistent and natural, {presentation}, casual authentic UGC selfie framing, soft natural window light, plain modern home interior softly blurred behind, genuine warm half-smile looking at the lens, product clearly visible and in sharp focus with its label readable, shot on a phone front camera, slight imperfection / realism (no studio polish), vertical 9:16.",
  },
  {
    key: "virtual_tryon",
    exampleImage: "/ad-angles/virtual_tryon.jpg",
    exampleVideo: "/ad-angles/virtual_tryon.mp4",
    label: "Virtual try-on",
    blurb: "Creator wearing the apparel, full-body GRWM mirror look. Best for clothing.",
    aspectRatio: "9:16",
    // Apparel try-on / haul intro. Deliberately NOT {presentation}
    // (the apparel presentation says "wearing", which made the fusion
    // confuse/replace the garment — e.g. a random lotion). Instead:
    // the creator wears a PLAIN NEUTRAL base top and HOLDS UP the
    // exact garment from the product image so it's clearly visible
    // (the haul moment). Hard, explicit, single-product.
    template:
      "Feature the AI UGC creator from the reference image — same face, hair and body, standing, full body. She is wearing a simple plain solid-colour top and shorts (a neutral base outfit that does NOT compete). She holds UP the exact apparel item shown in the product image with both hands toward the camera so the full garment is clearly and completely visible — a 'get ready with me' clothing-haul moment in an aesthetic bedroom with a mirror and a slight creative mess, soft natural daylight, authentic iPhone front-camera UGC, natural HDR, real skin tones, no color grading, vertical 9:16. Show ONLY the apparel from the product image as the product — absolutely no skincare, cosmetics, bottles or any other product.",
  },
  {
    // Key intentionally still "problem_solution" (don't migrate — any
    // persisted ad-angle selections in the DB key off this string and
    // a rename would orphan them). The user-facing slot has been
    // repurposed into a Try-On-Haul angle now that we have a strong
    // video preview for it; the template below is the haul prompt.
    key: "problem_solution",
    exampleImage: "/ad-angles/problem_solution.jpg",
    exampleVideo: "/ad-angles/problem_solution.mp4",
    label: "Try On Haul",
    blurb: "Excited 'haul moment' — creator pulling pieces out of a bag/box, full-body energy. Highest-engagement format for apparel + accessories.",
    aspectRatio: "9:16",
    // Try-On Haul template. Sibling of virtual_tryon but framed as the
    // HAUL MOMENT (excited reveal, full-body energy, multiple pieces
    // implied) rather than a static GRWM mirror look. Same "neutral
    // base outfit + hold up the exact product" guard rails to keep
    // NB2 Edit from substituting a different item.
    template:
      "Feature the AI UGC creator from the reference image — same face, hair and body, standing full-body. She is wearing a simple plain solid-colour base outfit (neutral, non-competing) and excitedly holds UP the exact apparel/accessory item from the product image with both hands toward the camera so the full product is clearly and completely visible — a high-energy 'try-on haul' reveal moment, big genuine smile, slightly bouncy candid energy. Aesthetic bedroom with a mirror, a shopping bag visible nearby, soft natural daylight, authentic iPhone front-camera UGC look, natural HDR, real skin tones, no color grading, vertical 9:16. Show ONLY the item from the product image as the product — absolutely no skincare, cosmetics, bottles or any other product.",
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
    // Key intentionally still "unboxing" (don't migrate — any persisted
    // ad-angle selections in the DB key off this string and a rename
    // would orphan them). User-facing label is "Faceless unboxing" now;
    // the template generates a hands-only reveal (no face), which is the
    // top-converting unboxing variant on TikTok/Reels because it's
    // creator-agnostic (any brand can repurpose it across personas)
    // and reads as authentic-found-it-on-my-doorstep rather than
    // staged-influencer-content.
    key: "unboxing",
    exampleImage: "/ad-angles/unboxing.jpg",
    exampleVideo: "/ad-angles/unboxing.mp4",
    label: "Faceless unboxing",
    blurb: "Hands-only POV unboxing — no face. Top-converting variant on TikTok/Reels because it feels like a real customer, not an influencer ad.",
    aspectRatio: "9:16",
    // Faceless / hands-only template. Critical guardrails:
    //   - explicit "no face / no head in frame" (NB2 will default to
    //     including the creator's face from the reference image otherwise)
    //   - "the creator's hands" anchors identity to skin tone /
    //     manicure / sleeves from the reference without dragging the
    //     face in
    //   - packaging/product centered, hands as the secondary subject
    template:
      "Top-down or shoulder-down POV unboxing shot. The creator's hands ONLY enter the frame — using the hands from the AI UGC creator reference image (same skin tone, same nails/sleeves) to lift the product out of its packaging. ABSOLUTELY NO FACE in the frame, no head, no shoulders above the chest — strictly a faceless hands-and-product composition. {presentation} but framed so the product and the opened packaging/box are the visual centerpiece. Clean neutral surface (light wood desk or kitchen counter) softly blurred, bright soft natural daylight, authentic phone-camera POV unboxing UGC look, product label and packaging in sharp focus, vertical 9:16.",
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
    exampleVideo: "/ad-angles/demo.mp4",
    label: "Demo / how-to",
    blurb: "Creator actively using or applying the product, mid-action.",
    aspectRatio: "9:16",
    template:
      "Feature the AI UGC creator from the reference image, keeping their look and vibe consistent and natural, focused engaged expression, mid-action, {presentation}, close-ish UGC framing so the product use is clearly visible, natural everyday lighting, authentic tutorial energy, product in sharp focus, vertical 9:16.",
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
