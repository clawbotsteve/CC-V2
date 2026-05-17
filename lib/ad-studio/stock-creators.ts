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
  /** Stable id — also the image filename: /creators/{id}.jpg */
  id: string;
  /** Display name. */
  name: string;
  /** Short casting descriptor shown under the name. */
  vibe: string;
  /** Which DTC verticals this creator reads well for (UI hint /
   *  future filtering). */
  bestFor: string[];
}

export const STOCK_CREATORS: StockCreator[] = [
  {
    id: "ava",
    name: "Ava",
    vibe: "Girl-next-door · early 20s",
    bestFor: ["beauty", "skincare", "lifestyle"],
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

export function stockCreatorImage(id: string): string {
  return `/creators/${id}.jpg`;
}
