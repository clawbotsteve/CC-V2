/**
 * Ad Studio — product-type awareness.
 *
 * The ad-angle templates used to hardcode "holding the product up
 * toward the camera at chest height". That's right for a serum
 * bottle and WRONG for a hat (a hat gets worn), a watch (worn on the
 * wrist), a serum (applied to skin), a supplement (capsule in palm),
 * a drink (sipped), etc. A product-blind prompt produces flat,
 * catalog-looking output — the #1 quality complaint.
 *
 * This module maps a product to HOW the creator should physically
 * present/use it, as a participial phrase that slots cleanly into
 * every angle template via the {presentation} placeholder. The angle
 * still owns the emotion / setting / camera; the product type owns
 * the physical interaction.
 *
 * UX intent (stays true to the "don't make me think" thesis):
 * detectProductType() auto-picks a sensible type from the product
 * name/title; the user can override with one tap. Never a required
 * field, never a free-text prompt box.
 */

export type ProductTypeKey =
  | "generic"
  | "hat"
  | "eyewear"
  | "apparel"
  | "footwear"
  | "bag"
  | "jewelry"
  | "watch"
  | "skincare"
  | "makeup"
  | "haircare"
  | "supplement"
  | "beverage"
  | "food"
  | "gadget"
  | "home";

export interface ProductType {
  key: ProductTypeKey;
  /** Chip label in the UI. */
  label: string;
  /**
   * Participial phrase describing how the creator physically
   * presents/uses the product. MUST read naturally when dropped
   * into ", {presentation}," inside an angle template. Always refers
   * to "the product reference" so it stays generic.
   */
  presentation: string;
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    key: "generic",
    label: "Hold to camera",
    presentation:
      "holding the product from the product reference up near their face toward the camera, label clearly facing the lens",
  },
  {
    key: "hat",
    label: "Hat / headwear",
    presentation:
      "wearing the hat from the product reference on their head, looking natural and flattering, one hand lightly touching the brim",
  },
  {
    key: "eyewear",
    label: "Sunglasses / glasses",
    presentation:
      "wearing the eyewear from the product reference, framing their face naturally",
  },
  {
    key: "apparel",
    label: "Clothing",
    presentation:
      "wearing the apparel item from the product reference, showing how it looks on with a relaxed natural pose",
  },
  {
    key: "footwear",
    label: "Shoes",
    presentation:
      "showing off the footwear from the product reference on their feet, feet and lower legs in frame",
  },
  {
    key: "bag",
    label: "Bag / accessory",
    presentation:
      "holding and showing off the bag from the product reference, worn or carried naturally",
  },
  {
    key: "jewelry",
    label: "Jewelry",
    presentation:
      "wearing the jewelry from the product reference, subtly drawing attention to it near the neckline or hand",
  },
  {
    key: "watch",
    label: "Watch",
    presentation:
      "wearing the watch from the product reference on their wrist, wrist raised and turned so the watch face is clearly visible",
  },
  {
    key: "skincare",
    label: "Skincare",
    presentation:
      "holding the skincare product from the product reference up near their face, mid skincare moment with fresh clean skin",
  },
  {
    key: "makeup",
    label: "Makeup",
    presentation:
      "applying the makeup product from the product reference to their face, mid-application",
  },
  {
    key: "haircare",
    label: "Haircare",
    presentation:
      "using the haircare product from the product reference in their hair",
  },
  {
    key: "supplement",
    label: "Supplement / vitamin",
    presentation:
      "holding the supplement from the product reference in one hand with a capsule, gummy or scoop in the other hand",
  },
  {
    key: "beverage",
    label: "Drink",
    presentation:
      "holding the drink from the product reference, about to take a sip, label facing the camera",
  },
  {
    key: "food",
    label: "Food / snack",
    presentation:
      "holding the food from the product reference, about to take a bite, packaging visible",
  },
  {
    key: "gadget",
    label: "Tech / device",
    presentation:
      "holding and actively using the device from the product reference",
  },
  {
    key: "home",
    label: "Home / kitchen",
    presentation:
      "holding and using the product from the product reference in their space",
  },
];

const TYPE_BY_KEY: Record<ProductTypeKey, ProductType> = PRODUCT_TYPES.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<ProductTypeKey, ProductType>,
);

export function productPresentation(key: ProductTypeKey | undefined): string {
  return (TYPE_BY_KEY[key ?? "generic"] ?? TYPE_BY_KEY.generic).presentation;
}

/**
 * Keyword heuristic — maps a product name / scraped title to a
 * sensible default type. Order matters: most specific first.
 * Returns "generic" when nothing matches (safe fallback = current
 * behavior). This is a DEFAULT, always user-overridable.
 */
export function detectProductType(text: string | undefined | null): ProductTypeKey {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "generic";
  const has = (...words: string[]) =>
    words.some((w) => new RegExp(`\\b${w}`, "i").test(t));

  if (has("sunglass", "eyewear", "glasses", "shades", "spectacle")) return "eyewear";
  if (has("hat", "cap\\b", "beanie", "headwear", "visor", "bucket hat")) return "hat";
  if (has("watch", "smartwatch", "timepiece")) return "watch";
  if (
    has("ring\\b", "necklace", "earring", "bracelet", "jewelry", "jewellery",
      "pendant", "anklet", "chain\\b")
  )
    return "jewelry";
  if (
    has("shoe", "sneaker", "boot", "footwear", "heel", "sandal", "loafer",
      "trainer\\b", "cleat")
  )
    return "footwear";
  if (
    has("bag", "backpack", "purse", "tote", "wallet", "handbag", "duffel",
      "crossbody")
  )
    return "bag";
  if (
    has("serum", "moisturiz", "moisturis", "cleanser", "sunscreen", "spf\\b",
      "skincare", "lotion", "cream\\b", "toner", "exfoliant", "retinol",
      "hyaluronic", "face mask", "eye cream")
  )
    return "skincare";
  if (
    has("lipstick", "mascara", "foundation", "concealer", "blush", "eyeliner",
      "eyeshadow", "makeup", "lip gloss", "bronzer", "primer\\b")
  )
    return "makeup";
  if (
    has("shampoo", "conditioner", "hair oil", "haircare", "hair mask",
      "hair serum", "dry shampoo", "leave-in")
  )
    return "haircare";
  if (
    has("supplement", "vitamin", "capsule", "gummies", "gummy", "protein",
      "collagen", "probiotic", "creatine", "pre-workout", "powder\\b",
      "electrolyte", "omega")
  )
    return "supplement";
  if (
    has("coffee", "\\btea\\b", "drink", "beverage", "juice", "soda", "kombucha",
      "energy drink", "smoothie", "matcha", "seltzer", "water bottle")
  )
    return "beverage";
  if (
    has("snack", "\\bbar\\b", "chocolate", "candy", "cookie", "jerky", "chips",
      "granola", "food\\b")
  )
    return "food";
  if (
    has("phone", "charger", "headphone", "earbud", "earphone", "speaker",
      "gadget", "device", "electronic", "camera\\b", "laptop", "keyboard",
      "smart\\b", "tech\\b", "powerbank")
  )
    return "gadget";
  if (
    has("candle", "kitchen", "mug\\b", "bottle\\b", "tumbler", "decor", "home\\b",
      "cleaner", "diffuser", "blanket", "pillow", "cookware", "utensil")
  )
    return "home";
  if (
    has("shirt", "tee\\b", "t-shirt", "hoodie", "sweater", "jacket", "dress\\b",
      "apparel", "clothing", "top\\b", "legging", "pants", "jeans", "shorts",
      "activewear", "outfit", "sweatshirt", "skirt", "coat\\b")
  )
    return "apparel";
  return "generic";
}
