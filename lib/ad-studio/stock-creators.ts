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
  },
  {
    id: "maya",
    name: "Maya",
    vibe: "Warm relatable · late 20s",
    bestFor: ["wellness", "supplements", "home"],
  },
  {
    id: "sofia",
    name: "Sofia",
    vibe: "Polished beauty creator · 20s",
    bestFor: ["beauty", "haircare", "fashion"],
  },
  {
    id: "kai",
    name: "Kai",
    vibe: "Fitness guy · 20s",
    bestFor: ["fitness", "supplements", "menswear"],
  },
  {
    id: "noah",
    name: "Noah",
    vibe: "Approachable everyman · 30s",
    bestFor: ["gadgets", "grooming", "outdoor"],
  },
  {
    id: "jada",
    name: "Jada",
    vibe: "Gen-Z hype · early 20s",
    bestFor: ["fashion", "accessories", "trend products"],
  },
  {
    id: "elena",
    name: "Elena",
    vibe: "Busy mom · 30s",
    bestFor: ["home", "kids", "wellness", "kitchen"],
  },
  {
    id: "marcus",
    name: "Marcus",
    vibe: "Confident professional · 30s",
    bestFor: ["tech", "finance", "menswear", "grooming"],
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
