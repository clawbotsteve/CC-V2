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
 * Talking-hook product clause (Seedance-2 text-to-video). Unlike
 * `presentation` (which refers to "the product reference" image),
 * this is text-only and names the product directly so the talking
 * creator visibly holds/wears/uses it on camera — Higgsfield-style
 * (their prompt describes the product inline too). No image input
 * exists for this model, so the rendered product is described-from-
 * text (looks like it, not pixel-exact — Phase-2 stitch is exact).
 */
const TALKING_CLAUSE: Record<ProductTypeKey, (p: string) => string> = {
  generic: (p) => `holding ${p} up toward the camera`,
  hat: (p) => `wearing ${p} on their head`,
  eyewear: (p) => `wearing ${p}`,
  apparel: (p) => `wearing ${p}, showing how it looks on`,
  footwear: (p) => `showing off ${p} on their feet`,
  bag: (p) => `holding and showing off ${p}`,
  jewelry: (p) => `wearing ${p}`,
  watch: (p) => `wearing ${p} on their wrist`,
  skincare: (p) => `holding ${p} up near their face`,
  makeup: (p) => `holding ${p} near their face`,
  haircare: (p) => `holding ${p}`,
  supplement: (p) => `holding ${p}`,
  beverage: (p) => `holding ${p}, about to take a sip`,
  food: (p) => `holding ${p}, about to take a bite`,
  gadget: (p) => `holding and using ${p}`,
  home: (p) => `holding and using ${p}`,
};

export function talkingProductClause(
  key: ProductTypeKey | undefined,
  productName?: string,
): string {
  const p = (productName && productName.trim()) || "the product";
  return (TALKING_CLAUSE[key ?? "generic"] ?? TALKING_CLAUSE.generic)(p);
}

/**
 * Per-type MOTION beat for Seedance image-to-video. A still only
 * freezes one moment; the i2v model needs to be told what should
 * physically move in the ~5s clip. Product-type aware for the same
 * reason the still is: a phone case is tilted so the contents catch
 * the light; a hat is adjusted; a drink is lifted toward a sip.
 */
const PRODUCT_MOTION: Record<ProductTypeKey, string> = {
  generic:
    "she holds the product up to the camera and slowly turns it so the label catches the light, small natural micro-expressions and a relaxed smile",
  hat: "she adjusts the hat on her head and tilts her head slightly, relaxed natural movement, a small smile to camera",
  eyewear:
    "she lightly touches the frame and turns her head slightly, relaxed confident micro-movements",
  apparel:
    "she shifts and turns slightly to show how it fits, relaxed natural movement, a glance at the camera",
  footwear:
    "a gentle camera tilt as she shifts her stance and the footwear is shown clearly",
  bag: "she lifts and turns the bag slightly to show it off, relaxed natural movement",
  jewelry:
    "she moves slightly so the jewelry catches the light, gentle natural movement, a soft smile",
  watch:
    "she turns her wrist so the watch face catches the light, subtle natural movement",
  skincare:
    "she holds the product near her face and tilts it slightly, calm relaxed skincare-moment movement, a soft smile",
  makeup:
    "a small natural application gesture with the product near her face, relaxed and unhurried",
  haircare:
    "she runs the product or a hand through her hair in a small natural motion",
  supplement:
    "she shakes the bottle gently and shows a capsule or scoop, a natural relaxed gesture and small smile",
  beverage:
    "she lifts the drink toward a sip and lowers it again, a relaxed satisfied micro-expression",
  food: "she lifts it slightly as if about to take a bite, a relaxed enjoyable expression",
  gadget:
    "small natural finger movements as she interacts with the device, focused then a glance up with a smile",
  home: "a small natural gesture using or turning the product in her space",
};

/**
 * Build a layered Seedance i2v motion prompt (Higgsfield-style:
 * shot spec + subject action beat + energy/realism), product-type
 * aware. Keeps it to the ~5s of subtle motion Seedance does well
 * (NOT dialogue / multi-shot — that's a different model).
 */
export function buildSeedanceMotionPrompt(
  key: ProductTypeKey | undefined,
): string {
  const beat = PRODUCT_MOTION[key ?? "generic"] ?? PRODUCT_MOTION.generic;
  return [
    "Vertical 9:16 selfie-style UGC phone video, handheld, subtle natural camera movement, warm natural light, real skin tones, no filter.",
    `The creator stays consistent and natural: ${beat}.`,
    "Authentic unpolished UGC energy, the product stays clearly visible, in frame and in sharp focus the whole time. Subtle and real, not over-animated.",
  ].join(" ");
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
