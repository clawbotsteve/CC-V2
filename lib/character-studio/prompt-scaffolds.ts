/**
 * Character Studio prompt scaffolds — 90 hand-tuned prompts (15 per niche)
 * across 6 niches. Variables in {curly_braces} are filled by GPT-4o based
 * on the user's character setup at runtime (see fill-prompts.ts).
 *
 * Variable conventions:
 *   {character}     — Full first-prompt description (name + type + traits).
 *                     Subsequent prompts use first name only to save tokens.
 *   {brand}         — Optional. Show / agency / brand name from setup.
 *   {product}       — Optional. Featured product / book / topic / collection.
 *
 * Aspect ratio: 13/15 are 9:16 in most niches per the dashboard / TikTok /
 * IG-native pivot. 2/15 are cinematic 16:9 (action / stage moments) where
 * width genuinely helps.
 *
 * `hasText: true` flags scaffolds that lean on GPT Image 2's typography
 * rendering (clip thumbnails, magazine covers, book launches). For
 * Animated character types the runtime may skip these — see
 * fill-prompts.ts for the skip logic.
 *
 * `hasNoCharacter: true` flags scaffolds that are object-only still-lifes
 * (e.g. meal-prep flat-lay). These produce great prompt-pack output but
 * are skipped from the LoRA training set since the LoRA has no face to
 * learn from.
 */

export type Niche =
  | "fitness_influencer"
  | "lifestyle"
  | "ugc_creator"
  | "motivational_speaker"
  | "podcast"
  | "ai_model";

export interface PromptScaffold {
  /** 1-15. Order matters for variation generation (the wildcard is always last). */
  number: number;
  /** Short label shown in the Character Studio prompt-pack UI. */
  label: string;
  /** Loose category tag for grouping in the UI. */
  contentType: "Action" | "Lifestyle" | "Editorial" | "Demo";
  /** Native aspect ratio. Used both for the FAL image gen call and the
   *  card sizing in the UI. */
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:5";
  /** Raw prompt with {character} / {brand} / {product} placeholders. */
  template: string;
  /** Per-prompt notes used by GPT-4o when filling. Undefined for most. */
  hint?: string;
  /** Designated wildcard (last prompt in each niche). Used to deliberately
   *  diversify the LoRA training set so the model doesn't overfit to one
   *  scene type. */
  isWildcard?: boolean;
  /** This scaffold leans on GPT Image 2's typography. Heavy text
   *  rendering; may produce mixed results on Animated characters. */
  hasText?: boolean;
  /** No character in frame (still-life). Skipped from LoRA training set. */
  hasNoCharacter?: boolean;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  FITNESS INFLUENCER                                                    */
/* ────────────────────────────────────────────────────────────────────── */

export const FITNESS_INFLUENCER: PromptScaffold[] = [
  {
    number: 1,
    label: "Mid-rep deadlift money shot",
    contentType: "Action",
    aspectRatio: "9:16",
    template: "Overhead low-angle view of {character}, mid-rep on a heavy deadlift, knurled barbell with thick rubber bumper plates locked at the top of the lift, back straight and locked-out, forearms strained and veined, slight motion blur on the bar, gritty industrial garage gym with raw concrete floor and dimming overhead fluorescents, sweat beaded on forearms and brow, faint chalk dust suspended in air, hard contrasty fluorescent lighting, photoreal skin texture, gym-creator authenticity, 9:16.",
  },
  {
    number: 2,
    label: "Post-workout pump mirror selfie",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} mirror selfie in a basement gym locker room after a heavy lift, oversized cropped tank revealing visible delt and chest pump, high-waisted leggings with side seam catching the light, sweat patches on the front of the shirt, water bottle with heavy condensation hanging from one hand, smartphone slightly off-angle creating realistic phone-glare reflection, harsh overhead industrial fluorescents casting hard shadows under the eyes, vending machine and locker doors blurred behind, casual creator-economy authenticity (no glossy retouch), 9:16.",
  },
  {
    number: 3,
    label: "Trail run, breath-visible",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} stopped mid-stride on a misty mountain trail at first light, breath visible in the cold morning air, performance running tights and an insulated tech half-zip with sleeves pushed up, smartwatch on wrist showing a heart-rate readout, wireless earbuds in, beads of perspiration at the temples, blurred wet pine needles and pebbles in the foreground, dramatic mountain backdrop fading into low fog, cinematic wide frame, slight film grain, 9:16.",
  },
  {
    number: 4,
    label: "Macro meal-prep flat-lay",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical over-the-shoulder shot of a meal-prep spread on a butcher-block kitchen counter, three glass-lidded containers arranged in a tight grid with color-blocked compositions: chicken + jasmine rice + broccoli, salmon + sweet potato + asparagus, lean ground beef + couscous + roasted peppers. Sprig of fresh rosemary scattered between containers, a digital kitchen scale with grams reading visible, whole avocado, half lemon, parsley sprigs styled around the frame, hard natural window light from camera-left, slight steam rising from one open container, food-magazine quality, hand of {character} just visible at frame edge reaching for a container, 9:16.",
    hint: "Hand of character visible at frame edge so this still serves the LoRA training set.",
  },
  {
    number: 5,
    label: "Cold plunge",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} chest-deep in a wooden whiskey-barrel cold plunge tub at dawn, water steaming visibly into the cold morning air, several ice cubes floating on the surface, jaw clenched in focused stillness, eyes closed, droplets clinging to the shoulders and face, the tub set on a concrete patio overlooking a pine forest, soft blue pre-sunrise light, a thermometer clipped to the rim reading 38°F, photoreal water texture, breath caught in mid-exhale, 9:16.",
  },
  {
    number: 6,
    label: "Form-check coaching moment",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} demonstrating squat form to the camera in a professional commercial gym, lateral mid-position with feet shoulder-width and a loaded barbell on the back, white compression tank and high-waisted shorts, smart watch on wrist, a full-length squat-rack mirror behind reflecting the back angle, a clipboard and labelled water bottle on the floor in pre-focus foreground, even neutral gym lighting, photoreal fabric and skin texture, instructional energy, 9:16.",
  },
  {
    number: 7,
    label: "Pre-workout fuel shot",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical angle on a marble kitchen counter, golden morning light through linen curtains: a frosted protein-shake bottle from {brand} with condensation, a supplement scoop dipped into a tub of pre-workout, half-eaten banana on a slate board, smartwatch in standby beside it, blurred fiddle-leaf fig in deep background, soft fabric napkin in foreground, hand of {character} just visible at frame edge resting on the counter, lifestyle-magazine styling, 9:16.",
    hint: "Brand product placement opportunity. If brand is empty, drop the brand reference and call the bottle 'a frosted protein-shake bottle'.",
  },
  {
    number: 8,
    label: "Squat-rack hero",
    contentType: "Action",
    aspectRatio: "9:16",
    template: "Low-angle hero shot of {character} mid-set under a loaded squat rack, plates clearly stacked (45s and 25s visible), face determined and slightly downturned, gritty chalk handprint on the bar, gym fluorescents raking across the bar from camera-right, fine chalk dust suspended in the air, raw matte concrete floor, photoreal skin tension and pulse-vein detail, beads of sweat at the temple, no music or text overlays — clean composition, 9:16.",
  },
  {
    number: 9,
    label: "Recovery stretching",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} mid-pose on a textured cork yoga mat in a sunlit minimalist studio, deep low-lunge stretch, eyes closed in calm focus, slow warm morning light streaming through floor-to-ceiling windows casting long shadows, a single small succulent in soft focus on a wood stool background, photoreal skin and faint perspiration sheen, calm wellness aesthetic, no equipment clutter, 9:16.",
  },
  {
    number: 10,
    label: "Athletic wear try-on",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} in a clean apartment bedroom, full-length leaning mirror selfie, modeling a new matching matte-black athletic two-piece set from {brand}, side-by-side {brand} product shopping bag on the floor with branded tissue paper, casual messy bun, no makeup, natural daylight from a side window, slightly off-angle phone with the screen reflection visible, unmade bed softly blurred behind, GRWM creator aesthetic, 9:16.",
  },
  {
    number: 11,
    label: "Outdoor sprint freeze-frame",
    contentType: "Action",
    aspectRatio: "16:9",
    template: "{character} frozen mid-sprint on an outdoor red rubber track, knee driving up and arms cycling, motion blur on the trailing leg, full athletic form, harsh midday sun creating a sharp body shadow on the track, a single bead of sweat caught mid-flight near the temple, blurred stadium bleachers and white lane lines in the deep background, cinematic 16:9, photoreal action photography, 16:9.",
  },
  {
    number: 12,
    label: "Protein-plate hero",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical angle of a perfect protein plate on a matte black ceramic dish: grilled salmon flaky and glistening, pearl couscous, charred asparagus tips, half a roasted lemon, a small ramekin of yogurt-tahini sauce. Garnished with a single dill sprig. White marble surface, hard daylight from above casting one clean soft shadow, restaurant-magazine styling, condensation beads on a glass of sparkling water at the corner of frame, hand of {character} just lifting the lemon at frame edge, 9:16.",
  },
  {
    number: 13,
    label: "Mirror flex-check, after-hours",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} in a gym after closing hours, only emergency exit lights and one overhead spot visible, mirror selfie flexing one bicep with a self-aware smirk, sleeveless training top, smart watch face reading 9:47 PM, a single dumbbell on the floor in the corner of frame, blue-and-amber security-light color cast, dramatic mood, gym-rat-after-hours authenticity, 9:16.",
  },
  {
    number: 14,
    label: "Cliff-top victory",
    contentType: "Editorial",
    aspectRatio: "16:9",
    template: "{character} standing at the edge of a granite cliff overlook after a long hike, technical baselayer and trekking shorts, hands on hips in a lived-in victorious posture, hair lifted by mountain wind, deep valley sweeping out behind fading into low cloud cover, slight golden afternoon backlight from camera-right but earned (not the generic 'golden-hour-everywhere' trope), photoreal landscape grain, slight anamorphic lens flare in upper-right, cinematic 16:9.",
  },
  {
    number: 15,
    label: "Editorial cover (wildcard)",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "{character} in a clean white studio, dramatic single overhead light source, wearing a black athletic crop top and matching leggings, bare feet on smooth seamless paper, hair pulled back tightly, neutral expression looking directly into the camera, arms folded in a quiet powerful stance, no environmental context, high-fashion editorial aesthetic, photoreal skin with visible pore detail, 9:16.",
    isWildcard: true,
  },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  LIFESTYLE                                                             */
/* ────────────────────────────────────────────────────────────────────── */

export const LIFESTYLE: PromptScaffold[] = [
  {
    number: 1,
    label: "Matcha pour, morning ritual",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Overhead-ish vertical shot of {character} at a marble kitchen counter, mid-pour of bright green ceremonial-grade matcha into a small ribbed glass cup, bamboo whisk and clear sifter beside the cup, single drop of matcha mid-fall caught in motion, soft warm morning light from camera-right through linen curtains, blurred journal and uncapped fountain pen on the counter, ceramic vase with a single eucalyptus stem softly out of focus, photoreal liquid texture, 'that girl' wellness aesthetic, 9:16.",
  },
  {
    number: 2,
    label: "Café POV with branded notebook",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Slightly above-eye-level shot from across a small marble café table: in the foreground, a perfect latte with intricate rosetta art in a thick-rimmed cream ceramic cup, a folded paperback novel face-down beside it, a stack of two unwrapped pastries on a wooden board, a {brand} notebook with a fountain pen resting on top. In soft mid-distance focus: {character} mid-thought, gaze just past camera, warm cardigan sleeves visible, golden window light cutting across the table, slight sun flare in upper-right, café terrace bistro chairs blurred behind, photoreal grain, 9:16.",
  },
  {
    number: 3,
    label: "Farmers market errand",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} mid-stride at a Sunday farmers market, oversized vintage tote bag overflowing with a long baguette poking out, fresh lavender stems, a single ribbon-wrapped bouquet of wildflowers, a paper-wrapped wedge of cheese visible on top. Linen wide-leg trousers, neutral knit top, no makeup, hair tucked behind one ear. Blurred wooden farm stalls and pumpkin display behind, dappled sunlight through canvas tent fabric, photoreal grain, candid soft-life aesthetic, 9:16.",
  },
  {
    number: 4,
    label: "'That girl' desk",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical desk flat-lay shot from chest height: a glass of cucumber-mint water with condensation, an open lined journal mid-entry in cursive ('5 AM | gratitude | move'), a daily supplement caddy with morning compartments open showing pill mix, a rose-gold AirPods case, a small white candle softly lit, a fresh stem of yellow tulip in a clear vase. Sun-bleached wood desk, warm window light from camera-left raking across the surface, slight steam rising from a half-empty teacup, hand of {character} just visible at frame edge holding the journal open, no clutter, magazine-quality 'that girl' aesthetic, 9:16.",
  },
  {
    number: 5,
    label: "Apartment reset day",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} mid-action wiping down a sage-green velvet couch with a microfiber cloth, modern apartment with floor-to-ceiling windows and natural light, neutral-tone throw blanket folded on the armrest, a basket of folded laundry on the floor, a fresh lit candle on the coffee table, hair in a messy claw clip, oversized cream sweatshirt, casual matching shorts, photoreal slight motion blur on the cleaning hand, 'reset day' aesthetic, 9:16.",
  },
  {
    number: 6,
    label: "Mirror OOTD",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} full-length mirror selfie in a hallway with a neutral linen curtain background, modeling an outfit: oversized black wool blazer over a fitted white tank, vintage straight-leg denim, square-toe black loafers, small gold hoop earrings, a single thin gold chain. Phone slightly off-angle creating real phone-glare reflection in the mirror, soft natural daylight from off-frame window, casual messy bun, slight half-smile, no over-retouching, GRWM authenticity, 9:16.",
  },
  {
    number: 7,
    label: "Hosting moment",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical shot of an intimate dinner-party tablescape at dusk: long linen runner, several thin tapered candles in mismatched brass holders, ceramic plates with rustic charred sourdough and butter, a half-finished bottle of natural orange wine, faded peony blooms in a low ceramic vase, hand-blown wine glasses with smudges (lived-in, not staged), {character} slightly blurred in background mid-laugh holding a glass, candlelight casting warm flicker across her face, photoreal soft focus, dinner-party magazine aesthetic, 9:16.",
  },
  {
    number: 8,
    label: "Reading nook",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} curled up in a deep oatmeal-colored linen armchair by a tall window, oversized chunky cream cardigan with sleeves over hands, an open hardcover book held up at eye level, a steaming mug of black tea on a stool beside, knitted throw blanket draped over legs, slight rain visible on the window glass behind, soft cool diffused afternoon light, photoreal fabric texture and skin pore detail, intimate quiet aesthetic, 9:16.",
  },
  {
    number: 9,
    label: "Balcony golden hour",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} leaning on a wrought-iron balcony railing in a Lisbon-feeling neighborhood, terracotta rooftops below fading into haze, holding a glass of natural wine catching golden afternoon light, white linen slip dress catching the breeze, tiled balcony floor, single potted olive tree in the corner of frame, slight wind in hair, eyes closed in calm satisfaction, photoreal skin with visible peach-fuzz at the temple, earned (not generic) golden hour, 9:16.",
  },
  {
    number: 10,
    label: "Renovation in progress",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} mid-action with a paint roller in hand, painting an interior wall a warm muted clay color, white painter's overall splattered with the same paint, hair tucked under a knotted bandana, paint roller tray on a drop cloth, half-painted wall showing the before/after divide, exposed wood floor below, ladder visible at frame edge, natural daylight from a large window, candid creator-economy authenticity, 9:16.",
  },
  {
    number: 11,
    label: "Drive POV",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical from-passenger-seat angle on {character} driving a vintage cream Mercedes 280SE convertible on a coastal road, top down, hair lifted by the wind, sunglasses pushed up into hair, soft cashmere knit and silk scarf, blurred Pacific Coast cliffs racing past camera-left, late afternoon golden light, hand resting on the leather steering wheel, photoreal cinematic grain, escapism aesthetic, 9:16.",
  },
  {
    number: 12,
    label: "Bath ritual",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Slightly elevated angle of {character} shoulder-deep in a clawfoot bathtub with bubble foam, eyes closed in restful focus, hair piled in a loose top-knot, several thin tapered candles burning along the tub edge, a marble side-stool with an open book and an amber-glass wine goblet, a single eucalyptus stem floating on the water, soft warm tungsten light, faint steam rising, serene wellness aesthetic, 9:16.",
  },
  {
    number: 13,
    label: "Skincare drop close-up",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Extreme close-up vertical shot of {character}'s face from forehead to chin in soft daylight, mid-application of a serum from {brand}: a single golden-amber drop suspended on the pad of the index finger just above the cheekbone, glossy skin reflecting the light, faint freckles visible, no makeup, eyes closed, peaceful expression, photoreal skin pore detail and natural fine peach fuzz, magazine-quality beauty editorial, 9:16.",
  },
  {
    number: 14,
    label: "Bookstore browse",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} mid-action in a narrow aisle of an independent bookstore, pulling a hardcover off a packed wooden shelf, head slightly tilted reading the spine, oversized cream wool sweater and a folded scarf draped over one shoulder, soft warm tungsten lighting from yellowing pendant bulbs, blurred floor-to-ceiling shelves stretching out behind, dust motes catching the light, photoreal grain, candid lifestyle aesthetic, 9:16.",
  },
  {
    number: 15,
    label: "High-fashion editorial (wildcard)",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "{character} in a clean studio against a muted clay-pink seamless backdrop, wearing a structured oversized chocolate-brown wool coat, neutral makeup with a single sharp red lip, hair slicked back tightly, hands tucked into pockets, three-quarter angle, neutral expression looking just past camera, single sharp top-light from camera-left casting a clean shadow, no environmental context, photoreal skin with visible texture, high-fashion magazine aesthetic, 9:16.",
    isWildcard: true,
  },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  UGC CREATOR                                                           */
/* ────────────────────────────────────────────────────────────────────── */

export const UGC_CREATOR: PromptScaffold[] = [
  {
    number: 1,
    label: "POV product reveal",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "Slightly above-eye-level POV of {character} holding up {product} from {brand} directly toward the camera, focused intently on the label, soft daylight from camera-right through a slightly out-of-focus bedroom window, hair in a casual half-up, no full makeup, oversized cream sweatshirt, blurred unmade bed and scattered pillows behind, slight phone-camera distortion at the edges, fingerprint smudges visible on the product label suggesting real use, photoreal warm skin tone, casual creator-economy authenticity, 9:16.",
  },
  {
    number: 2,
    label: "Bathroom GRWM mid-application",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "{character} mirror selfie in a small apartment bathroom, mid-application of {product} from {brand}, fingertips of one hand pressing into the cheek, the other hand holding the phone slightly off-angle creating real phone-glare reflection, half-done makeup look (one eye lined, one not), hair pulled back in a clip, oversized bath towel still wrapped, harsh overhead bathroom light combined with warm tungsten vanity bulbs creating mixed-temperature shadows, scattered open makeup tubes and brushes on the counter, photoreal skin with visible pores and faint redness from cleansing, GRWM aesthetic, 9:16.",
  },
  {
    number: 3,
    label: "Before / after split-frame",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "Single vertical split-frame: identical position, lighting, and crop on both halves of {character}'s face. Left side labeled in small clean sans-serif 'BEFORE' — tired morning look, slight under-eye shadows, no makeup, dull skin. Right side labeled 'AFTER' — same pose and angle, glow-up post-{product} from {brand}, brightened complexion, natural radiance, no other changes (same outfit, same hair, same crop, same time of day). Soft natural daylight, photoreal skin texture on both halves, phone-camera authenticity, classic comparison-review format, 9:16.",
    hasText: true,
  },
  {
    number: 4,
    label: "Unboxing moment",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Slightly above-eye-level vertical from {character}'s perspective sitting cross-legged on a pale oak floor, mid-action lifting {product} from a {brand} shipping box, brand-printed tissue paper crinkling around it, the box flap open revealing a thank-you card, scattered bubble wrap and a thin packing slip on the floor beside, casual at-home outfit (cropped tank, sweatpants), natural daylight from a window camera-right, photoreal hands and product texture, candid unboxing-haul aesthetic, slightly off-center framing, 9:16.",
  },
  {
    number: 5,
    label: "Bedside morning moment",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Top-down vertical of a wood bedside table at 8AM: {product} from {brand} placed deliberately center-left, an analog alarm clock reading 8:14, an iPhone face-down with a knit case, a half-empty glass of water with bubbles still inside, a folded scrunchie, two stray hair ties, an open book face-down at chapter 3, a single fresh coffee mug with steam rising, soft warm window light raking across the surface from camera-left, hand of {character} just visible reaching for the mug, photoreal grain, 'that girl' morning-routine aesthetic, 9:16.",
  },
  {
    number: 6,
    label: "Walking-and-talking selfie POV",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "Front-facing phone camera POV of {character} walking down a sunlit residential sidewalk, slight handheld shake, holding {product} from {brand} up at chest height while speaking mid-sentence, casual outfit, natural late-afternoon light, blurred suburban houses and dappled tree shadows scrolling past in the background, phone-camera fisheye distortion at edges, faint motion blur, photoreal skin and lip texture, classic walk-and-talk creator format, 9:16.",
  },
  {
    number: 7,
    label: "Hand swatch demo close-up",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "Extreme close-up vertical of the back of {character}'s hand held up to natural daylight, three pristine swatches of {product} from {brand} smeared across the skin (lightest to richest left to right), slight fingertip-pressure indentations visible at one edge, soft window light revealing the texture and shimmer of each shade, blurred bathroom counter background, no other styling, photoreal skin pores and faint hand veining, classic demo-shot aesthetic, 9:16.",
  },
  {
    number: 8,
    label: "Bathroom counter still life",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Slightly above-eye-level vertical of a marble bathroom counter, {product} from {brand} placed front-and-center with the label visible and slightly turned for photogenic angle, scattered around it: an open tube of toothpaste, two used cotton rounds with faint cleanser on them, a hair-tie with strands in it, a folded face cloth, a small succulent in a clay pot, water droplets on the marble suggesting real use, soft daylight from a frosted bathroom window, slight reflection of {character}'s face visible in a small adjacent mirror corner, photoreal grain, lived-in morning-routine authenticity, 9:16.",
  },
  {
    number: 9,
    label: "Driver's seat moment",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical from-passenger-seat angle on {character} in the driver's seat at a stoplight, {product} from {brand} placed casually on the passenger seat in soft-focus foreground, sunglasses pushed up on the head, soft cashmere knit, hand resting on the steering wheel, blurred dashboard and rear-view mirror with hanging car keys, late afternoon golden light spilling through the windshield, slight phone shake, photoreal skin texture, candid in-car content aesthetic, 9:16.",
  },
  {
    number: 10,
    label: "Application mid-skincare",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "Vertical close-up of {character} mid-application of {product} from {brand} on the cheek, fingertips of one hand pressing gently into the skin, eyes half-closed in focused concentration, neck-up framing, hair pulled back tightly, no other makeup, soft diffused window light from camera-left highlighting the slight glossy texture of the product on the cheek, photoreal pore detail and faint capillary visibility, peaceful skincare-routine aesthetic, slight steam from a recently-used facial steamer softly blurred in the background, 9:16.",
  },
  {
    number: 11,
    label: "Side-by-side comparison",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "Single vertical frame: {character} from chest-up holding two competing products side-by-side at chin level, the {product} from {brand} in one hand (positioned slightly higher and more in focus to favor it visually), a generic-label competitor in the other hand, slight playful skeptical expression looking from one to the other (eyebrow raised, mouth slightly off to the side), casual at-home outfit, soft natural light from camera-front, blurred kitchen counter with a half-empty coffee mug behind, photoreal hand and product texture, comparison-review aesthetic, 9:16.",
  },
  {
    number: 12,
    label: "Coffee morning with brand",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Slightly above-eye-level vertical of {character} holding a warm {brand} ceramic mug to the mouth at a kitchen counter, eyes mid-blink (caught natural moment), oversized cream sweater sleeves stretched over hands, hair in a messy claw clip, {product} placed on the counter to one side, scattered breakfast crumbs and a half-eaten croissant on a small plate, warm morning window light, casual cozy authenticity, photoreal skin and faint steam rising from the mug, 9:16.",
  },
  {
    number: 13,
    label: "Reaction-face product hold",
    contentType: "Demo",
    aspectRatio: "9:16",
    template: "Vertical chest-up shot of {character} holding {product} from {brand} close to the face at jaw level, exaggerated wide-eyed pleasantly-surprised reaction (eyebrows up, lips parted in a small 'oh'), looking directly at camera, casual at-home outfit (cropped tee, no jewelry), soft window light from camera-left, blurred neutral wall behind, photoreal skin and lip texture, classic UGC review-reaction aesthetic — feels caught-in-the-moment, not staged, 9:16.",
  },
  {
    number: 14,
    label: "Mirror haul try-on",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} full-length mirror selfie in an apartment hallway after unboxing a {brand} order, modeling the new {product}, three more {brand} shopping bags clustered on the floor with branded tissue paper spilling out, casual messy bun, no makeup, natural daylight from an off-frame window, slightly off-angle phone with realistic phone-glare in the mirror, blurred apartment hallway behind, casual creator-economy authenticity (no glossy retouch), 9:16.",
  },
  {
    number: 15,
    label: "Magazine editorial portrait (wildcard)",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "{character} in a clean studio, three-quarter face turn, dramatic single-source studio side-light from camera-left creating sharp cheekbone shadows, holding {product} from {brand} close to the chin in a still elegant pose, hair pulled into a low chignon, neutral high-fashion makeup (sharp brow, glossed lip), wearing a structured cream silk shirt unbuttoned at the collar, no environmental context, seamless oat-colored backdrop, magazine commercial-portrait quality, photoreal skin pore and product label detail, 9:16.",
    isWildcard: true,
  },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  MOTIVATIONAL SPEAKER                                                  */
/* ────────────────────────────────────────────────────────────────────── */

export const MOTIVATIONAL_SPEAKER: PromptScaffold[] = [
  {
    number: 1,
    label: "Stage hero from low angle",
    contentType: "Action",
    aspectRatio: "16:9",
    template: "Dramatic low-angle shot of {character} mid-keynote on a darkened stage, single warm spotlight from above isolating in a clean rim of light, dressed in a tailored matte-black turtleneck and dark jeans, body language locked-in (hands open, speaking with conviction), front rows of audience visible in soft focus below the stage with hundreds of phone screens raised glowing into the dark, dust particles caught in the spotlight beam, photoreal grain, magazine-quality conference photography, 16:9.",
  },
  {
    number: 2,
    label: "Quote card portrait overlay",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Tight black-and-white portrait of {character} in three-quarter angle, jaw-set serious expression, hard rim-light from camera-right cutting across the cheekbone, pure black background, no environmental context. Massive bold uppercase Didone serif title overlapping the lower half of the portrait in cream off-white, two stacked lines: 'COMFORT IS / KILLING YOU.' Beneath in tiny spaced mono caps: 'EP. 047 · {brand} · NEW EPISODE FRIDAY.' Photoreal skin texture and pore detail visible despite the high-contrast monochrome grade, magazine-quality typography rendering, 9:16.",
    hasText: true,
  },
  {
    number: 3,
    label: "Podcast clip thumbnail",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Single vertical podcast-clip frame: {character} mid-sentence at a wooden studio table, leaning into a Shure SM7B black broadcast microphone on a boom arm, headphones around neck, soft warm bulb lighting from camera-right, dark moody studio backdrop, jaw open mid-word, hands gesturing in front. Across the bottom third of the frame in massive bold condensed sans-serif uppercase, three stacked lines: 'WHAT NOBODY / TELLS YOU ABOUT / RUNNING A BUSINESS.' Right-aligned tag in tiny mono caps below: 'EP. 052 · {brand} · 1.4M VIEWS.' Photoreal skin and microphone metal texture, podcast-thumbnail aesthetic, 9:16.",
    hasText: true,
  },
  {
    number: 4,
    label: "Whiteboard framework moment",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Slightly off-angle vertical of {character} mid-sentence at a large white-magnetic whiteboard, black dry-erase marker in hand mid-stroke completing a hand-drawn framework. The whiteboard shows clean handwritten content: header 'THE 1-3-5 RULE,' then three rows below: '1 BIG · stuff that scares you,' '3 MEDIUM · moves the needle,' '5 SMALL · keep momentum.' Connected by hand-drawn arrows. Casual at-home outfit (charcoal henley, joggers), morning daylight from a window, photoreal handwriting and marker-ink texture, coaching-content aesthetic, 9:16.",
    hasText: true,
  },
  {
    number: 5,
    label: "Late-night work",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical close-up of {character} at a dark wood desk after midnight, only the cool glow of a laptop screen lighting the face from below, focused intense expression, jaw set, hand mid-keystroke on a black mechanical keyboard, single brass desk lamp casting a small warm pool of light on a leather-bound notebook in the foreground, an empty espresso cup, blurred dark home-office walls behind with a single framed minimalist print, photoreal skin and face shadow detail, 'doing the work' aesthetic, 9:16.",
  },
  {
    number: 6,
    label: "Cold plunge discipline",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} chest-deep in a wooden whiskey-barrel cold plunge tub at 5AM, water steaming visibly into the cold pre-dawn air, ice cubes floating on the surface, jaw clenched, eyes closed in focused stillness, breath caught mid-exhale, droplets clinging to shoulders and face, the tub set on a concrete patio overlooking a misty pine forest, soft blue pre-sunrise light, a thermometer clipped to the rim reading 38°F, photoreal water texture, discipline-content aesthetic without the parody, 9:16.",
  },
  {
    number: 7,
    label: "Pre-dawn run",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "{character} mid-stride on a dark predawn city street, breath visible in cold air, technical running tights and a fitted insulated half-zip, smartwatch on wrist clearly reading 4:47 AM, single overhead orange streetlamp casting a hard pool of warm light on wet asphalt, blurred glowing storefronts behind, photoreal motion blur on the trailing leg, intentional grit to the image, 5AM-club aesthetic, 9:16.",
  },
  {
    number: 8,
    label: "Library reading",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical of {character} deep in focused reading at a long wooden library table, leather-bound first-edition {product} propped open with one hand, the other hand holding a fountain pen mid-annotation in the margin, brass green-shaded library lamp casting a warm pool of light, blurred floor-to-ceiling oak bookshelves stretching out behind, dust motes catching the lamp light, photoreal grain, classic-academia aesthetic, 9:16.",
  },
  {
    number: 9,
    label: "Pen-on-paper journaling",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Tight overhead vertical of {character}'s hand mid-write in a leather-bound notebook on a dark wood desk. Clean handwritten content visible across two pages: left page header 'MORNING REPS' followed by handwritten lines '— move 60 min,' '— read 30 pgs,' '— ship 1 thing,' '— call mom.' Right page header 'BLOCKERS' with two handwritten items 'fear of looking dumb,' 'comfort.' Black ballpoint pen mid-stroke on the second page, espresso cup in foreground softly out of focus, warm window light from camera-left, photoreal paper grain and ink texture, journaling-content aesthetic, 9:16.",
    hasText: true,
  },
  {
    number: 10,
    label: "Window contemplation",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "{character} standing at a floor-to-ceiling window in a high-rise office at blue hour, hands tucked into pockets of dark wool trousers, side-profile silhouette against the city skyline below glittering with lit windows and distant red helicopter lights, faintly visible reflection of the face in the glass showing focused contemplation, single warm tungsten lamp in deep background creating a soft golden anchor inside the room, photoreal grain, 'weight of leadership' aesthetic, 9:16.",
  },
  {
    number: 11,
    label: "One-on-one coaching",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical mid-shot of {character} across a wooden table from a client at a quiet café or studio, leaning forward intently with both forearms on the table, eye contact locked, hand gesturing one open palm mid-sentence, soft warm window light from camera-right, two espresso cups and a leather notebook between them, blurred warm interior backdrop, photoreal skin and clothing texture, coaching-session aesthetic, 9:16.",
  },
  {
    number: 12,
    label: "Book launch hero",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical clean editorial portrait of {character} holding a new book {product} cover-out at chest height in both hands. Book cover shown clearly: massive bold serif title across the top reading 'THE WORK IS THE POINT,' subtitle in italic serif below: 'Notes on building a life that doesn't break.' Author byline at the bottom in clean spaced caps: '{character} · {brand} PRESS.' {character} looking directly at camera with a quiet half-smile, dark turtleneck, clean off-white seamless backdrop, soft directional light from camera-left, photoreal skin and book-cover material texture (matte stock with subtle grain), magazine-quality launch portrait, 9:16.",
    hasText: true,
  },
  {
    number: 13,
    label: "Behind the podium",
    contentType: "Action",
    aspectRatio: "16:9",
    template: "Wide cinematic shot of {character} mid-keynote at a tall wooden lectern on a stage at a major business conference, hand raised gesturing one finger up to make a point, microphone gooseneck lit from above, hard cool theatrical lighting from camera-left, subtle smoke/haze in the air revealing light beams, large blurred conference-branded screen behind reading event title in soft focus, photoreal skin and stage texture, conference-keynote-photography aesthetic, 16:9.",
  },
  {
    number: 14,
    label: "Airport boss energy",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical of {character} mid-stride through a sleek modern airport terminal, dressed in a fitted black wool overcoat over a charcoal turtleneck and dark trousers, leather weekender bag slung over one shoulder, holding a {brand} coffee in the other hand, sunglasses pushed up into hair, locked-in focused expression, blurred warm gate-area lighting and a long wall of departure-board screens visible in deep background, slight motion blur on the back leg, photoreal grain, executive-on-the-move aesthetic, 9:16.",
  },
  {
    number: 15,
    label: "Editorial cover portrait (wildcard)",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "{character} in a clean studio against a deep matte-charcoal seamless backdrop, three-quarter face turn looking just past camera with a calm intelligent expression, hands clasped low, dressed in a simple black knit and wool trousers, single dramatic top-light from camera-front-left creating sharp cheekbone shadow and a clean rim along the jaw, no environmental context, photoreal skin pore detail and natural fabric texture, high-end business-magazine cover quality, 9:16.",
    isWildcard: true,
  },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  PODCAST                                                                */
/* ────────────────────────────────────────────────────────────────────── */

export const PODCAST: PromptScaffold[] = [
  {
    number: 1,
    label: "Solo monologue at mic",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical close-up of {character} alone at a dark walnut studio table, leaning into a Shure SM7B black broadcast microphone on a boom arm, large studio headphones on, eyes closed mid-thought, one hand flat on the table, soft warm Edison-bulb light from camera-right casting a single direction shadow, dark moody studio backdrop with a faint glowing acoustic-panel grid wall behind, photoreal skin texture and microphone metal grain, intimate solo-record aesthetic, 9:16.",
  },
  {
    number: 2,
    label: "Two-person across the table",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Slightly off-center vertical of {character} and a podcast guest seated across a long oak studio table, both leaning into matching Shure SM7B microphones on boom arms, both wearing studio headphones, mid-conversation with {character} listening intently to the guest, hands folded calmly on the table, single warm pendant lamp directly above the table casting a small pool of light, dark studio backdrop softly out of focus, two open notebooks between them, photoreal skin tones and table-grain texture, classic interview-podcast aesthetic, 9:16.",
  },
  {
    number: 3,
    label: "Episode thumbnail clip",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Single vertical podcast clip-thumbnail frame: {character} and a guest mid-conversation across a walnut studio table, both leaning into SM7B mics on boom arms, dim warm bulb lighting, dark studio backdrop. Across the top of the frame in massive bold condensed sans-serif uppercase, three stacked lines: 'THIS IS WHY / 99% OF FOUNDERS / QUIT TOO EARLY.' Lower-right corner small tag in mono caps: 'EP. 094 · {brand}.' Lower-left small mono: 'WITH {product}.' Photoreal skin and equipment texture, magazine-quality typography rendering, classic clip thumbnail composition, 9:16.",
    hasText: true,
  },
  {
    number: 4,
    label: "Pull-quote graphic from episode",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Single vertical pull-quote graphic: tight black-and-white close-up of {character} mid-laugh, head tipped slightly back, headphones on, blurred SM7B mic in foreground, hard rim-light from camera-right. Massive serif italic quote text overlapping the lower portion of the frame, four stacked lines in cream off-white: 'YOU DON'T / FIND YOUR / TASTE — / YOU EARN IT.' Below the quote in tiny spaced mono caps: '— {character} · EP. 094 · {brand}.' Photoreal skin texture despite the high-contrast monochrome grade, magazine-quality typography, 9:16.",
    hasText: true,
  },
  {
    number: 5,
    label: "Behind-the-scenes set view",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical from-the-control-room angle of a podcast set being recorded: in mid-distance focus, {character} and a guest mid-conversation across a wooden table with mics and headphones, in soft foreground a tripod with a Sony FX3 cinema camera framing them, faint red REC indicator light visible, blurred boom op silhouette in deeper background, warm key lights on the talent spilling color into the otherwise dim room, photoreal grain, multi-camera production aesthetic, 9:16.",
  },
  {
    number: 6,
    label: "Mic + setup hero shot",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical clean product-style shot of a podcast studio setup at rest: a Shure SM7B microphone front-and-center on a black Yellowtec boom arm, in-focus brand text visible on the mic body, blurred secondary mic and headphones beside it, warm edison-bulb light from camera-right creating soft chrome reflections on the mic grille, dark walnut table surface, single open leather-bound notebook softly out of focus in foreground, hand of {character} just visible at frame edge adjusting the boom, photoreal metal and fabric texture, equipment-detail aesthetic, 9:16.",
  },
  {
    number: 7,
    label: "Reaction face mid-laugh",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical chest-up shot of {character} mid-laugh during a record, head tipped back slightly, eyes scrunched, hand half-covering mouth, large studio headphones still on, blurred SM7B mic in foreground, dim warm studio lighting, photoreal skin texture and laugh lines, candid 'this guest just said something wild' reaction, perfect for episode-clip cutdowns, 9:16.",
  },
  {
    number: 8,
    label: "Walking-interview outdoors",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical of {character} mid-walk in conversation with a guest along a sunlit boardwalk or city sidewalk, both holding handheld lavalier-clipped wireless mics, both in casual smart-casual outfits, mid-stride and mid-sentence with hand gesturing, blurred urban backdrop scrolling past, warm late-afternoon sun, slight motion blur, slight phone-camera handheld feel, photoreal skin and fabric texture, on-location interview aesthetic, 9:16.",
  },
  {
    number: 9,
    label: "Live event audience record",
    contentType: "Action",
    aspectRatio: "16:9",
    template: "Wide cinematic shot of {character} live-recording a podcast in front of an audience at a small intimate venue, seated in two leather armchairs on a small raised stage, large boom mics overhead, two studio lights backlighting them creating a warm rim, audience visible in soft focus below the stage with a few attentive faces front-row, 'LIVE · {brand}' projected on a small wall plaque visible behind in soft focus, slight haze in air, photoreal grain, live-event-podcast aesthetic, 16:9.",
  },
  {
    number: 10,
    label: "Producer's-eye control-room view",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical from-behind-the-glass angle of a producer's hands at a console: in foreground sharp focus, the producer's hands on a black mixer/board with sliders and a glowing waveform on the laptop screen reading episode title 'EP. 094 — Founders & Failures.' In mid-distance through a soundproof glass window, {character} and a guest mid-conversation visible at the studio table with mics, single red REC indicator light glowing on the wall above them, dim warm lighting, photoreal hand texture and screen glow, post-production aesthetic, 9:16.",
  },
  {
    number: 11,
    label: "Guest holds the book",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical of {character} mid-conversation across the studio table with a guest who is holding up {product} cover-out toward camera. The book cover is clearly readable: bold serif title across the top, subtitle below in italic serif, author byline at the bottom. Both wearing headphones, both leaning slightly toward each other, the book held just below chin level so the cover is the visual anchor, dark walnut table, warm Edison-bulb light, photoreal skin and book-cover material grain, classic show-and-tell podcast moment, 9:16.",
    hasText: true,
  },
  {
    number: 12,
    label: "Wide studio shot",
    contentType: "Editorial",
    aspectRatio: "16:9",
    template: "Wide cinematic establishing shot of a polished podcast studio: {character} and a guest seated at a long walnut table mid-record, both leaning into SM7B mics on boom arms, two cameras on tripods framing them from camera-left and camera-right with red REC indicators glowing, soundproof black acoustic panels lining the walls, single warm pendant lamp directly over the table casting a clean pool of light, dim ambient studio backdrop with a glowing 'ON AIR' sign visible above the door in deeper background, photoreal grain, classic-studio establishing-shot aesthetic, 16:9.",
  },
  {
    number: 13,
    label: "Late-night studio",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical of {character} alone in the studio after-hours, hood up on a worn cotton hoodie, headphones on, leaning into the SM7B mic, only one warm desk lamp lit (the rest of the studio in shadow), single open laptop screen casting cool blue glow on a half-empty whiskey rocks glass and a closed notebook in foreground, dim moody mood, photoreal skin and lamp-light fall-off, 'recording at 1AM' aesthetic, 9:16.",
  },
  {
    number: 14,
    label: "Headphones detail moment",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Tight vertical close-up of {character} mid-adjustment on large dark-leather studio headphones, fingertips on the cup, head slightly tilted, eyes focused down on the mixer just out of frame, soft warm Edison-bulb side light, faint sheen on the worn leather padding, blurred mic boom in deep background, photoreal skin and leather texture, intimate equipment-fetish aesthetic, 9:16.",
  },
  {
    number: 15,
    label: "Editorial cover portrait (wildcard)",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical editorial portrait of {character} against a clean deep-charcoal seamless backdrop, three-quarter face turn looking past camera with a quiet intelligent expression, dressed in a simple charcoal knit, hands clasped low, dramatic single top-light from camera-front-left creating clean cheekbone shadow, no studio context. Across the bottom in clean sans-serif uppercase, two stacked lines: '{brand} · THE PODCAST.' Below in tiny mono spaced caps: 'NEW EPISODES EVERY THURSDAY.' Photoreal skin pore detail, magazine-cover quality typography rendering, 9:16.",
    isWildcard: true,
    hasText: true,
  },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  AI MODEL                                                              */
/* ────────────────────────────────────────────────────────────────────── */

export const AI_MODEL: PromptScaffold[] = [
  {
    number: 1,
    label: "Magazine cover",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Editorial fashion magazine cover, vertical 9:16, premium glossy aesthetic. Masthead at top in massive bold all-caps Didone serif: 'AURUM.' Below masthead in smaller spaced sans-serif: 'ISSUE 14 · SPRING 2026 · $14.00.' Centered subject {character} in three-quarter angle, dressed in a structured cream wool overcoat with raw-edge collar, hair slicked back tightly, bare shoulders visible above the coat, sharp clean makeup with a single matte burgundy lip, looking calmly past camera. Massive cover line in bold knocked-out serif overlapping the lower portion in cream off-white, two stacked lines: 'THE NEW / FACE.' Smaller cover lines stacked along the right edge in italic serif: 'Architects of identity in the synthetic age,' 'How AI rewrote the agency book,' 'Inside the new model economy.' Bottom-left corner barcode and small mono text 'aurummag.co.' Photoreal skin pore detail, magazine-quality typography rendering, 9:16.",
    hasText: true,
  },
  {
    number: 2,
    label: "Editorial beauty close-up",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Tight editorial portrait of {character} from collarbone up against a soft cream seamless backdrop, three-quarter face turn looking past camera with a calm focused expression, dewy fresh-skin makeup with no eye color (just bare lashes and a single warm gloss), hair slicked back wet-look with no flyaways, single sharp directional softbox light from camera-front-left creating a clean shadow under the jaw and a small specular highlight on the cheekbone, photoreal skin pore and fine peach-fuzz detail, no jewelry, magazine beauty-editorial aesthetic, 9:16.",
  },
  {
    number: 3,
    label: "Runway walk",
    contentType: "Action",
    aspectRatio: "16:9",
    template: "Wide cinematic shot of {character} mid-stride down a fashion-week runway, hard front-flash lighting from photographers in the pit, motion blur on the trailing leg, body locked in classic runway posture (chin up, arms relaxed at sides), wearing a structured oversized charcoal wool overcoat with exaggerated dropped shoulders over a cream silk slip dress, square-toe black leather boots, blurred audience visible in soft focus on either side, photographers' camera flashes burning white at frame edges, polished concrete runway floor, photoreal motion blur and fabric movement, fashion-week photography aesthetic, 16:9.",
  },
  {
    number: 4,
    label: "Street style candid",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical paparazzi-style candid of {character} mid-stride exiting a fashion-week show, oversized vintage trench coat over a silk slip dress, square-toe boots, vintage leather handbag in one hand, sunglasses on, hair tucked behind one ear caught by the wind, multiple photographers' cameras visible softly blurred in the deep foreground, soft afternoon light filtering through plane trees lining a Paris street, blurred yellow Paris taxi behind, photoreal grain and slight motion blur, street-style fashion-week aesthetic, 9:16.",
  },
  {
    number: 5,
    label: "Lookbook hero outfit",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical full-body lookbook shot of {character} against a clean cream seamless studio backdrop, three-quarter front-on stance with one hand tucked into a coat pocket, dressed in a structured oversized charcoal wool blazer with peaked lapels over a high-neck cream cashmere knit, wide-leg ivory linen trousers with a sharp crease, simple square-toe black loafers, no jewelry except a thin gold chain visible at the collar, hair slicked back tightly, bare-skin makeup with one matte cream lip, single soft directional key light from camera-front-left, secondary subtle fill from the right, no shadows on the backdrop, photoreal skin and fabric texture, premium lookbook quality, 9:16.",
  },
  {
    number: 6,
    label: "Skin / glass-skin beauty",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical extreme close-up of {character}'s face from forehead to chin against a soft pearl-grey seamless backdrop, eyes closed in calm focus, fresh dewy 'glass skin' look with high reflective skin sheen, bare lashes (no mascara), a single drop of clear serum suspended on the pad of an index finger near the cheekbone, faint freckles visible across the nose, slight natural under-eye hollow showing, hard top-light single source creating dramatic cheekbone shadow, photoreal skin pore detail and fine peach-fuzz, magazine beauty-editorial aesthetic, 9:16.",
  },
  {
    number: 7,
    label: "Polaroid comp card",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical model agency composite card on cream cardstock, industry-standard print format. Top quarter: large polaroid-style portrait of {character} looking directly at camera with neutral expression, no makeup, hair pulled back, plain backdrop, 'POLAROID — UNRETOUCHED' caption tag below it. Above the polaroid in massive thin black uppercase serif: '{character}.' Below the polaroid in tiny mono caps: 'DIGITAL TALENT · {brand} · BOARD: WOMEN MAIN.' Center half of card: 4-panel grid of the same person in 4 industry poses — runway, beauty close-up, editorial fashion shot, motion mid-step — on plain backdrops, all 4 panels showing consistent identity. Bottom third: stats block in tiny tabular mono uppercase, two columns: 'DIGITAL HEIGHT — 5'10\" / 178 CM,' 'EYES — DARK BROWN,' 'HAIR — LONG · NATURAL,' 'COMPLEXION — NEUTRAL OLIVE,' 'DRESS — US 4 / EU 36' / 'SHOE — US 8 / EU 39,' 'AVAILABLE FOR — CAMPAIGNS · LOOKBOOK · E-COM · MOTION,' 'EXCLUSIVITY — BEAUTY UNTIL Q3 2026,' 'NON-UNION.' Bottom strip in tiny black sans-serif on cream: 'BOOKINGS — BOOKINGS@{brand}.CO.' Industry-standard composite-card aesthetic, photoreal faces with consistent identity across all 5 panels, magazine-quality typography, 9:16.",
    hasText: true,
  },
  {
    number: 8,
    label: "Brand campaign poster",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical fashion campaign launch poster, 9:16, designed for Instagram launch. Background: clean ivory paper grain. Top of frame, small lockup with two logos and a thin × between them. Left logo in elegant Didone serif: '{brand}.' Center: thin hairline ×. Right logo in clean spaced sans-serif: '{character}.' Below in tiny spaced uppercase mono: 'PRESENTS THE {product} CAMPAIGN.' Center of frame: large hero image of {character} in three-quarter angle, golden-tan skin, dressed in flowing ivory silk slip dress, standing barefoot on a terracotta rooftop in soft golden afternoon light. Massive headline overlapping the lower hero shot in thin italic serif, two lines, off-white type with subtle drop shadow: 'soft / season.' Bottom strip with three small text elements left-to-right: '#{brand}x{character},' 'AVAILABLE 18 MARCH,' '{brand}.com/{character}.' Premium fashion campaign aesthetic, photoreal skin and fabric texture, 9:16.",
    hasText: true,
  },
  {
    number: 9,
    label: "Behind-the-scenes hair/makeup",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical close-up of {character} seated in a director's-style hair/makeup chair, eyes closed, bare-faced, two stylists' hands visible at the edges of the frame mid-task (one hand applying eyeshadow with a brush, another adjusting hair), warm makeup-vanity bulbs surrounding a large mirror in soft background blur, scattered open palettes and brushes on the counter, slight reflection of {character} in the mirror, photoreal skin pore detail, candid behind-the-scenes fashion-shoot aesthetic, 9:16.",
  },
  {
    number: 10,
    label: "Test shoot contact sheet",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical mock contact sheet of {character} from a fashion test shoot, 4×3 grid of 12 small frames each showing a slightly different pose (different head angle, hair flicked, hand position, expression), all on the same plain cream backdrop. Each frame numbered in tiny mono caps below it: '01' through '12.' Some frames marked with small red wax-pencil 'X' (rejected takes), others with small red circles (selected takes). Top of contact sheet in clean spaced sans-serif: '{character} · TEST · ROLL 02.' Bottom in tiny mono: 'PHOTOGRAPHY · {brand} STUDIO · MARCH 2026.' Slight off-white scanned-paper grain texture, photoreal facial consistency across all 12 frames, agency contact-sheet aesthetic, 9:16.",
    hasText: true,
  },
  {
    number: 11,
    label: "Couture gown moment",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical of {character} standing alone in the center of a vast empty marble palace ballroom at dusk, wearing a dramatic couture gown — sweeping ivory silk taffeta with a long train pooling around the feet, structured exaggerated shoulder, hair sculpted into a tall classical updo, looking calmly past camera with a slight chin-down, single dramatic warm tungsten light streaming through a tall arched window from camera-left creating long shadows across the marble floor, faint gold leaf details visible on distant walls, photoreal fabric drape and skin texture, high-couture editorial aesthetic, 9:16.",
  },
  {
    number: 12,
    label: "Clean commercial portrait",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical commercial portrait of {character} against a flat cream seamless backdrop, body slightly turned 30 degrees from camera, head turned back to look directly at camera with a gentle approachable expression, simple white sleeveless ribbed knit top, no jewelry, hair down and softly tucked behind one ear, soft natural-skin makeup with a fresh peach-tone cheek and a clean glossed lip, three-point even commercial lighting, no harsh shadows, photoreal skin pore detail, e-commerce / commercial-headshot aesthetic, 9:16.",
  },
  {
    number: 13,
    label: "Catwalk backstage chaos",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical of {character} mid-action backstage at a fashion-week show, mid-walk through the narrow chaos of dressers, garment racks, and makeup chairs, half-dressed in a couture gown still being clipped at the back by a dresser, hair pinned in foils, blurred other models being prepped on either side, harsh fluorescent backstage lighting overhead combined with hot tungsten spots from individual makeup mirrors creating mixed-temperature shadows, photoreal grain, candid fashion-week-backstage aesthetic, 9:16.",
  },
  {
    number: 14,
    label: "Editorial spread layout",
    contentType: "Editorial",
    aspectRatio: "9:16",
    template: "Vertical mock magazine editorial spread layout, 9:16. Background: warm cream paper grain. Three columns of cropped editorial photographs of {character} arranged across the page (two small frames in the left column, one tall frame in the center, two small in the right column), each photo a different look from the same shoot — color-correlated warm earth tones throughout. Across the top in massive condensed bold uppercase serif, two stacked lines spanning the full width: 'A QUIETER / KIND OF NEW.' Below in smaller italic serif: 'a portfolio of {character} for {brand} magazine, photographed by olu adesina.' Bottom-right page-number badge in tiny mono caps: 'P. 84 — 91 · ISSUE 14.' Photoreal skin and clothing consistency across all the small frames, magazine-spread typography, editorial-portfolio aesthetic, 9:16.",
    hasText: true,
  },
  {
    number: 15,
    label: "Off-duty candid (wildcard)",
    contentType: "Lifestyle",
    aspectRatio: "9:16",
    template: "Vertical of {character} off-duty in a coffee shop in Tokyo, no makeup, hair tied up in a casual claw clip, oversized vintage white t-shirt, paper face mask pulled down to the chin, holding an iced matcha, soft afternoon light through a frosted window, blurred warm-wood interior with a few other patrons softly out of focus, photoreal skin and casual-clothing texture, candid lifestyle aesthetic, 9:16.",
    isWildcard: true,
  },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  Niche registry                                                         */
/* ────────────────────────────────────────────────────────────────────── */

export interface NicheConfig {
  key: Niche;
  label: string;
  emoji: string;
  description: string;
  scaffolds: PromptScaffold[];
}

export const NICHES: Record<Niche, NicheConfig> = {
  ai_model: {
    key: "ai_model",
    label: "AI Model",
    emoji: "👗",
    description: "Editorial, runway, lookbooks, brand campaigns.",
    scaffolds: AI_MODEL,
  },
  ugc_creator: {
    key: "ugc_creator",
    label: "UGC Creator",
    emoji: "📦",
    description: "Product reviews, unboxings, GRWM, before/after.",
    scaffolds: UGC_CREATOR,
  },
  fitness_influencer: {
    key: "fitness_influencer",
    label: "Fitness Influencer",
    emoji: "💪",
    description: "Gym, outdoor, transformation, nutrition.",
    scaffolds: FITNESS_INFLUENCER,
  },
  lifestyle: {
    key: "lifestyle",
    label: "Lifestyle",
    emoji: "🌿",
    description: "Day-in-the-life, café moments, soft-life aesthetic.",
    scaffolds: LIFESTYLE,
  },
  motivational_speaker: {
    key: "motivational_speaker",
    label: "Motivational Speaker",
    emoji: "🎤",
    description: "Stage, podcast clips, frameworks, discipline.",
    scaffolds: MOTIVATIONAL_SPEAKER,
  },
  podcast: {
    key: "podcast",
    label: "Podcast",
    emoji: "🎧",
    description: "Studio, two-person interviews, clip thumbnails.",
    scaffolds: PODCAST,
  },
};

export const NICHE_KEYS = Object.keys(NICHES) as Niche[];
