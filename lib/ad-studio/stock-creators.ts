/**
 * Tavira stock creator roster.
 *
 * Curated, ready-to-use AI creators an ecom brand can pick off the
 * shelf and immediately make ads with — zero training, zero friction.
 * This is the single biggest onboarding-friction remover for the
 * ecom pivot (it's the moat Arcads/Creatify are built on).
 *
 * Each entry needs ONE great reference image at /creators/{id}.jpg.
 * Ad Studio's fusion path (Nano Banana 2 Edit) works off a reference
 * image, so a single strong shot per creator is enough — no LoRA
 * required for the ad flow. (If we later want pixel-identical
 * consistency across hundreds of ads we can train LoRAs for the
 * roster, but the reference-image approach ships now and is what
 * NB2 Edit consumes.)
 *
 * CASTING PRINCIPLE — UGC that converts looks like a real customer
 * filming on their phone, NOT a glossy model. Skew authentic-
 * attractive + relatable. Variety is the value: a brand should be
 * able to find one that matches THEIR customer. The roster below is
 * a sensible default spread across the archetypes that cover most
 * DTC verticals (beauty, supplements, fitness, home, fashion,
 * gadgets). Edit freely — names/vibes are just defaults.
 *
 * The Ad Studio UI degrades gracefully (branded gradient + name)
 * when an image isn't present yet — same pattern as the hero and
 * ad-angle thumbnails. Ships before the assets land; lights up the
 * moment {id}.jpg files are dropped in public/creators/.
 */

export interface StockCreator {
  /** Stable id — also the primary image filename: /creators/{id}.jpg */
  id: string;
  /** Display name. */
  name: string;
  /** Short casting descriptor shown under the name. */
  vibe: string;
  /** Which DTC verticals this creator reads well for (UI hint /
   *  future filtering). */
  bestFor: string[];
  /**
   * How many reference photos exist for this creator in
   * public/creators/. The fusion path (Nano Banana 2 Edit) accepts
   * multiple reference images and locks identity MUCH harder with
   * 2-3 angles than with one — so a stock creator should ship with
   * a small SET of premade photos, not a single shot. Convention:
   *   /creators/{id}.jpg      (primary — used for the picker tile)
   *   /creators/{id}-2.jpg
   *   /creators/{id}-3.jpg    ... up to imageCount
   * Defaults to 1 (just the primary) so the roster works the moment
   * a single shot is dropped in; bump per-creator as more angles
   * are added.
   */
  imageCount?: number;
  /**
   * Rich text description of the creator for the Seedance-2.0
   * TALKING-hook (text-to-video). Seedance 2.0 hard-blocks any
   * human-likeness image input (E005 deepfake gate), so the talking
   * creator's identity can ONLY come from this persona text. Written
   * to resemble the roster tile so the picked creator ≈ what the
   * user sees talking.
   */
  persona: string;
  /**
   * Locked random seed for the talking-hook. Same persona + same
   * seed → a consistent-looking creator across every ad, which is
   * how we get a repeatable "creator" with no uploadable reference.
   */
  seed: number;
}

export const STOCK_CREATORS: StockCreator[] = [
  {
    id: "ava",
    name: "Ava",
    vibe: "Relatable beauty creator · 20s",
    bestFor: ["beauty", "skincare", "lifestyle", "fashion"],
    // Ships with a 3-shot set (ava.jpg / ava-2.jpg / ava-3.jpg) so
    // NB2 Edit locks her identity hard across every ad.
    imageCount: 3,
    persona:
      "A 25-year-old Latina woman, warm relatable girl-next-door, long dark wavy brown hair, light freckles across the nose, natural minimal makeup, friendly approachable energy, casual everyday style",
    seed: 88488,
  },
  {
    id: "maya",
    name: "Maya",
    vibe: "Warm relatable · late 20s",
    bestFor: ["wellness", "supplements", "home"],
    persona:
      "A 28-year-old Black woman, warm and relatable, natural voluminous curly hair, soft expressive eyes, genuine easy smile, minimal makeup, cozy everyday style",
    seed: 41200,
  },
  {
    id: "sofia",
    name: "Sofia",
    vibe: "Polished beauty creator · 20s",
    bestFor: ["beauty", "haircare", "fashion"],
    persona:
      "A 24-year-old Latina woman, polished beauty-creator look, sleek glossy dark hair, subtle tasteful glam makeup, confident warm energy",
    seed: 73355,
  },
  {
    id: "kai",
    name: "Kai",
    vibe: "Fitness guy · 20s",
    bestFor: ["fitness", "supplements", "menswear"],
    persona:
      "A 25-year-old East Asian man, fit athletic build, short modern textured haircut, light stubble, friendly confident energy, fitted casual athletic style",
    seed: 25190,
  },
  {
    id: "noah",
    name: "Noah",
    vibe: "Approachable everyman · 30s",
    bestFor: ["gadgets", "grooming", "outdoor"],
    persona:
      "A 34-year-old white man, approachable everyman, short tidy brown hair, short well-kept beard, warm easy genuine smile, casual relaxed style",
    seed: 60417,
  },
  {
    id: "jada",
    name: "Jada",
    vibe: "Gen-Z hype · early 20s",
    bestFor: ["fashion", "accessories", "trend products"],
    persona:
      "A 21-year-old mixed-race Gen-Z woman, warm light-brown skin, bold modern styled hair, expressive lively eyes, playful confident energy, trendy style",
    seed: 90631,
  },
  {
    id: "elena",
    name: "Elena",
    vibe: "Busy mom · 30s",
    bestFor: ["home", "kids", "wellness", "kitchen"],
    persona:
      "A 36-year-old white woman, busy relatable mom, shoulder-length natural brown wavy hair, soft warm genuine smile, light natural skin texture, minimal makeup, casual comfy style",
    seed: 33874,
  },
  {
    id: "marcus",
    name: "Marcus",
    vibe: "Confident professional · 30s",
    bestFor: ["tech", "finance", "menswear", "grooming"],
    persona:
      "A 33-year-old Black man, confident professional, clean short fade haircut, neat short beard, assured friendly energy, smart-casual style",
    seed: 51208,
  },
];

/** Primary image — used for the picker tile. */
export function stockCreatorImage(id: string): string {
  return `/creators/${id}.jpg`;
}

/**
 * The full reference set for a stock creator. Passed (leading,
 * before the product) to Nano Banana 2 Edit so identity locks hard
 * across the ad. Capped at 3 — more refs = stronger lock but
 * diminishing returns + token cost; 3 angles is the sweet spot.
 */
export function stockCreatorRefs(id: string): string[] {
  const c = STOCK_CREATORS.find((s) => s.id === id);
  const count = Math.min(Math.max(c?.imageCount ?? 1, 1), 3);
  const refs = [stockCreatorImage(id)];
  for (let i = 2; i <= count; i++) refs.push(`/creators/${id}-${i}.jpg`);
  return refs;
}

/** Resolve a picker image URL back to its stock creator id (so the
 *  client can hand the full ref set to the sample endpoint). */
export function stockCreatorIdFromImage(url: string): string | null {
  const m = url.match(/\/creators\/([a-z0-9_-]+)\.jpg$/i);
  if (!m) return null;
  return STOCK_CREATORS.some((s) => s.id === m[1]) ? m[1] : null;
}

export function getStockCreator(id: string): StockCreator | undefined {
  return STOCK_CREATORS.find((s) => s.id === id);
}

/**
 * Build the Seedance-2.0 text-to-video TALKING-hook prompt: the
 * creator's persona + a fixed UGC scene/delivery frame + the spoken
 * line. Returned with the creator's locked seed so the same creator
 * renders consistently across every ad (Seedance 2.0 takes no image
 * input — persona + seed IS the identity).
 */
export function buildTalkingHookPrompt(
  c: StockCreator,
  script: string,
): { prompt: string; seed: number } {
  const scene =
    "Vertical 9:16 selfie-style UGC phone video, warm casual room, soft natural " +
    "window light, authentic unpolished phone-camera look, natural handheld " +
    "movement, real skin texture, no filter. The creator talks directly to the " +
    "front phone camera with genuine, warm, excited energy and natural " +
    "micro-expressions.";
  const safe = script.replace(/["\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 240);
  return { prompt: `${c.persona}. ${scene} They say: "${safe}"`, seed: c.seed };
}
