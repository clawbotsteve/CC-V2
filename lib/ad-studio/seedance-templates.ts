/**
 * Seedance 2.0 prompt-construction library for Ad Studio Step 4.
 *
 * Implements the 7-part UGC Creator Playbook framework (June 2026
 * edition) as code, so users don't need to learn the framework
 * themselves — they pick a hook style + write one short dialogue
 * line, and the server assembles a Playbook-compliant structured
 * prompt at generate time.
 *
 *   Framework (Playbook §4):
 *     (a) Opening style line — aspect, format, camera, lighting, energy
 *     (b) Scene paragraph — place, light direction, surfaces, props
 *     (c) Subject paragraph — identity anchors (held constant per series)
 *     (d) Timecoded beats — camera + action + dialogue/sound + ambient
 *     (e) Dialogue/sound — fragmented, reactions over claims, deadpan close
 *     (f) Style + negatives — UGC aesthetic + natural sound + lock-down list
 *     (g) Reference tags — @Image1 / @Image2 inline
 *
 * IMPORTANT — single-image adaptation:
 * The Playbook's @Image1/@Image2 binding assumes two reference images
 * (model + product). Tavira's Ad Studio pipeline fuses creator+product
 * into ONE still by Step 4 (GPT Image 2 / Nano Banana 2). So we
 * collapse the reference syntax: every template addresses "the person
 * in the image" / "the hands in the image" — Seedance i2v's identity
 * lock to its single input frame does the work of @Image1/@Image2
 * positional binding.
 *
 * IMPORTANT — lip-sync safety (Playbook §7):
 * Splitting a dialogue line across beats with commas drifts the
 * lip-sync on clips longer than 6s. We instead place the WHOLE user
 * dialogue in the middle beat as one continuous flow, with the lock-
 * down phrase "speaks in one continuous flow, no pauses, accurate
 * lip sync" + the "no mid-sentence pause" negative. Beats 1 and 3
 * carry nonverbal reactions only.
 */

import type { AdAngleKey } from "./ad-angles";

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------

export type HookStyleKey = string;

export interface HookStyle {
  key: HookStyleKey;
  /** Short label for the picker chip. */
  label: string;
  /** Tooltip / sub-line for the chip. */
  blurb: string;
  /**
   * Suggested dialogue placeholder shown in the input. Helps users
   * who don't know what to write — they can type over it or use as-is.
   * Empty when `silent: true`.
   */
  placeholder: string;
  /**
   * Faceless / ASMR styles set this true → UI hides the dialogue
   * input entirely and the template uses sound cues instead of
   * spoken lines.
   */
  silent?: boolean;
}

export interface BuildVars {
  angleKey: AdAngleKey;
  hookStyleKey?: HookStyleKey;
  /** User's hook line. Required unless the chosen style is silent. */
  dialogue: string;
  /** Best-known product name (for scene/beat anchoring). */
  productName: string;
  duration: number;
  aspectRatio: "9:16" | "1:1" | "16:9";
}

// ----------------------------------------------------------------
// PER-ANGLE HOOK STYLES
// ----------------------------------------------------------------
// Two styles per angle keeps the picker uncluttered while giving
// users meaningful choice. Add more as we collect performance data
// on which hook archetypes convert best for each angle.

export const HOOK_STYLES: Record<AdAngleKey, HookStyle[]> = {
  lifestyle_hold: [
    {
      key: "punchy",
      label: "Punchy hook",
      blurb: "Pattern-interrupt opener — scroll-stopper",
      placeholder: 'Okay this might sound crazy but I need to show you this.',
    },
    {
      key: "casual_review",
      label: "Casual review",
      blurb: "Like telling a friend, chill energy",
      placeholder: "Okay I genuinely use this every day and you need it.",
    },
  ],
  virtual_tryon: [
    {
      key: "grwm",
      label: "GRWM",
      blurb: "Get-ready-with-me energy, relaxed chatty",
      placeholder: "Okay get ready with me — trying this on and I'm not sure yet.",
    },
    {
      key: "haul_reveal",
      label: "Haul reveal",
      blurb: "Excited 'you have to see this' moment",
      placeholder: "I just got this and the fit is unreal, you have to see.",
    },
  ],
  problem_solution: [
    {
      key: "skeptic_converted",
      label: "Skeptic → converted",
      blurb: "\"I wasn't sure but…\" — earned win",
      placeholder: "I'll be honest I was skeptical, but this actually changed things.",
    },
    {
      key: "excited_reveal",
      label: "Excited reveal",
      blurb: "High-energy haul moment with the fix",
      placeholder: "Okay you HAVE to see what just fixed my whole routine.",
    },
  ],
  testimonial: [
    {
      key: "skeptic",
      label: "I was skeptical",
      blurb: "Won-over expression, candid",
      placeholder: "Real talk — I did not expect this to actually work.",
    },
    {
      key: "storytime",
      label: "Story-time",
      blurb: "Relaxed storyteller, telling a friend",
      placeholder: "Okay storytime — I tried this for two weeks and here's what happened.",
    },
  ],
  unboxing: [
    {
      key: "calm_asmr",
      label: "Calm ASMR",
      blurb: "Slow, satisfying, sound-led — no voice",
      placeholder: "",
      silent: true,
    },
    {
      key: "product_hero",
      label: "Product hero",
      blurb: "Faster reveal, final beat fills the frame",
      placeholder: "",
      silent: true,
    },
  ],
  before_after: [
    {
      key: "glow_up",
      label: "Glow-up",
      blurb: "\"Look at this result\" — confident close",
      placeholder: "Two weeks. That's all it took, look at this.",
    },
    {
      key: "results_first",
      label: "Results first",
      blurb: "Lead with the after, then credit the product",
      placeholder: "This is what changed everything for me — let me show you.",
    },
  ],
  demo: [
    {
      key: "how_to",
      label: "How-to",
      blurb: "Step-by-step explainer, calm tutorial",
      placeholder: "Here's exactly how I use this every day — really easy.",
    },
    {
      key: "casual_demo",
      label: "Casual demo",
      blurb: "Mid-action, narrating along, no script feel",
      placeholder: "Okay so I'm doing this real quick — watch.",
    },
  ],
};

// ----------------------------------------------------------------
// SHARED BUILDING BLOCKS (Playbook §4f — style + negatives)
// ----------------------------------------------------------------

const NEGATIVES_TALKING =
  "No on-screen text, no visible phone or reflection of a phone, no studio lighting, " +
  "no plastic skin. No morphing face, no distorted hands, no extra fingers, " +
  "no sudden movement, no mid-sentence pause.";

const NEGATIVES_SILENT =
  "No on-screen text, no visible phone, no distorted hands, no extra fingers, " +
  "no warping, no sudden movement.";

const STYLE_TALKING =
  "Authentic UGC aesthetic, real skin tones, natural iPhone HDR, handheld micro-shake. " +
  "Natural voice and room tone, no music, accurate lip sync.";

const STYLE_SILENT =
  "Authentic UGC ASMR aesthetic, real cotton texture, natural iPhone HDR, slight " +
  "handheld micro-shake. Crisp natural sound — tape, paper, fabric — no music, no voice.";

// ----------------------------------------------------------------
// BEAT TIMING
// ----------------------------------------------------------------
// 2 beats for ≤6s clips (lip-sync holds better), 3 beats for longer.
// Returns [(start, end), ...] tuples.

function beats(duration: number): Array<[number, number]> {
  const d = Math.max(3, Math.round(duration));
  if (d <= 6) {
    const mid = Math.round(d / 2);
    return [
      [0, mid],
      [mid, d],
    ];
  }
  const a = Math.round(d / 3);
  const b = Math.round((2 * d) / 3);
  return [
    [0, a],
    [a, b],
    [b, d],
  ];
}

function beatLabel([s, e]: [number, number]): string {
  return `${s}-${e}s`;
}

// ----------------------------------------------------------------
// DIALOGUE PLACEMENT (Playbook §7 — lip-sync safety)
// ----------------------------------------------------------------
// Always put the WHOLE dialogue in ONE beat (the middle for 3-beat,
// the second for 2-beat) with "speaks in one continuous flow" — this
// is the lip-sync-safe pattern. Splitting across beats with commas
// works for hand-tuned 8s clips but drifts unpredictably on anything
// longer or any line that doesn't naturally fall into 3 phrases.

function dialoguePlacement(
  duration: number,
  dialogue: string,
): { lines: string[]; speechBeat: number } {
  const bs = beats(duration);
  // The "talking" beat is the longest one — middle for 3-beat, second
  // for 2-beat (which is also typically the longer half).
  const speechBeat = bs.length === 3 ? 1 : 1;
  return {
    lines: bs.map(beatLabel),
    speechBeat,
  };
}

// ----------------------------------------------------------------
// PER-ANGLE TEMPLATE BUILDERS
// ----------------------------------------------------------------
// Each builder receives the resolved HookStyle so it can branch on
// style.key when needed (e.g. punchy vs casual_review). All builders
// return a single string ready to send to Seedance 2.0.

type Builder = (vars: BuildVars, style: HookStyle) => string;

const arLabel = (ar: BuildVars["aspectRatio"]) => `Vertical ${ar}`;

// Common talking-head scaffold used by most angles. Lets each angle
// just supply the scene + identity-anchor line + per-beat actions.
function buildTalkingHead({
  vars,
  style,
  openingFormat,
  energy,
  vibe,
  scene,
  identityAnchor,
  reactionsByBeat,
  ambient,
  lighting,
}: {
  vars: BuildVars;
  style: HookStyle;
  openingFormat: string;
  energy: string;
  vibe: string;
  scene: string;
  identityAnchor: string;
  /** Nonverbal micro-action per beat. Length must match beat count
   *  (2 for ≤6s, 3 for longer). */
  reactionsByBeat: string[];
  ambient: string;
  lighting: string;
}): string {
  const { dialogue, duration, aspectRatio } = vars;
  const safeDialogue = sanitizeDialogue(dialogue);

  const bs = beats(duration);
  const { speechBeat } = dialoguePlacement(duration, safeDialogue);

  // Pad/truncate reactions to beat count. Caller should match but
  // be defensive — wrong count would silently produce a malformed beat.
  const reactions = padBeats(reactionsByBeat, bs.length);

  const beatLines = bs.map(([s, e], i) => {
    const label = `${s}-${e}s`;
    const action = reactions[i];
    if (i === speechBeat && safeDialogue) {
      return `${label} — ${action}. "${safeDialogue}"`;
    }
    return `${label} — ${action}. (no line)`;
  });

  return [
    `${arLabel(aspectRatio)} ${openingFormat}, she speaks directly to the front camera, ` +
      `shot on iPhone, ${lighting}, ${energy}, "${vibe}" vibe, real skin tones, no filters.`,
    "",
    `${scene}. The phone is propped (no hands holding it, no phone visible).`,
    "",
    `The person in the image — match face, hair, identity exactly. ${identityAnchor}`,
    "",
    "She speaks in one continuous flow, no pauses, accurate lip sync:",
    ...beatLines,
    "",
    `Background: ${ambient}`,
    "",
    `${STYLE_TALKING} ${NEGATIVES_TALKING}`,
  ].join("\n");
}

// Common silent/ASMR scaffold for faceless unboxing.
function buildFaceless({
  vars,
  openingFormat,
  energy,
  scene,
  identityAnchor,
  beatActions,
  ambient,
}: {
  vars: BuildVars;
  openingFormat: string;
  energy: string;
  scene: string;
  identityAnchor: string;
  /** "{action} (sound: {what})" per beat. */
  beatActions: string[];
  ambient: string;
}): string {
  const { aspectRatio, duration } = vars;
  const bs = beats(duration);
  const actions = padBeats(beatActions, bs.length);
  const beatLines = bs.map(([s, e], i) => `${s}-${e}s — ${actions[i]}`);

  return [
    `${arLabel(aspectRatio)} ${openingFormat}, ${energy}, shot on iPhone, ` +
      "soft natural daylight, no dialogue, real textures, no filters.",
    "",
    scene,
    "",
    `The hands in the image — match skin tone, nails, sleeves exactly. ${identityAnchor}`,
    "",
    ...beatLines,
    "",
    `Ambient: ${ambient}`,
    "",
    `${STYLE_SILENT} ${NEGATIVES_SILENT}`,
  ].join("\n");
}

// ----------------------------------------------------------------
// THE BUILDERS — one per AdAngleKey
// ----------------------------------------------------------------

const BUILDERS: Record<AdAngleKey, Builder> = {
  // ---- UGC / lifestyle hold ----
  lifestyle_hold: (vars, style) => {
    const product = productClause(vars.productName);
    const isPunchy = style.key === "punchy";
    return buildTalkingHead({
      vars,
      style,
      openingFormat: `${isPunchy ? "hook-reel" : "selfie-review"} talking-head UGC`,
      energy: isPunchy
        ? "calm slightly-knowing energy"
        : "warm casual everyday energy",
      vibe: isPunchy ? "telling you a secret" : "telling a friend",
      lighting: isPunchy
        ? "moody warm light with soft natural window glow"
        : "soft daylight",
      scene: isPunchy
        ? "A cozy lived-in room — a soft lamp, framed art, plants in the background. She sits comfortably"
        : "A warm everyday room — soft window light, neutral textures, a mug nearby. She sits casually",
      identityAnchor: `${product} stays in frame near her, she presents it naturally without obscuring her face.`,
      reactionsByBeat: countReactionsForDuration(vars.duration, [
        "slight sway, calm half-smile",
        "small head tilt, hair settles, eyes meet the camera",
        "subtle knowing smile, small nod",
      ]),
      ambient: "soft daylight steady, her hair drifts slightly, ambient room tone.",
    });
  },

  // ---- Virtual try-on ----
  virtual_tryon: (vars, style) => {
    const product = productClause(vars.productName);
    const isGrwm = style.key === "grwm";
    return buildTalkingHead({
      vars,
      style,
      openingFormat: `${isGrwm ? "GRWM voiceover" : "try-on haul"} talking-head UGC`,
      energy: isGrwm
        ? "relaxed chatty energy"
        : "excited 'you have to see this' energy",
      vibe: isGrwm ? "get ready with me" : "haul reveal",
      lighting: isGrwm
        ? "soft warm vanity light"
        : "soft daylight with bright natural fill",
      scene: isGrwm
        ? "A bright bedroom or vanity area — a mirror, soft window light, neutral surfaces. She stands or sits near the mirror"
        : "A cozy bedroom with a mirror visible — soft daylight, a shopping bag nearby, neutral linens. She stands at full-body framing",
      identityAnchor: `She holds up ${product} so the full item is clearly visible to camera — never obscuring her face.`,
      reactionsByBeat: countReactionsForDuration(vars.duration, [
        isGrwm
          ? "a quick glance to the mirror then back to camera, holds the item up beside her"
          : "lifts the item up beside her face with both hands, excited eyes-wide reaction",
        isGrwm
          ? "holds the item against her chest, glances down then up, easy smile"
          : "turns the item slightly to show the front, big genuine smile, slight bounce",
        isGrwm
          ? "lowers the item slightly, satisfied warm smile, looks straight at camera"
          : "holds the item proudly to camera one last time, beaming confident close",
      ]),
      ambient: "soft daylight steady, hair moves slightly, fabric of the item shifts as she moves it.",
    });
  },

  // ---- Try-On Haul (key still "problem_solution" — see ad-angles.ts comment) ----
  problem_solution: (vars, style) => {
    const product = productClause(vars.productName);
    const isSkeptic = style.key === "skeptic_converted";
    return buildTalkingHead({
      vars,
      style,
      openingFormat: "haul-reveal talking-head UGC",
      energy: isSkeptic
        ? "honest 'I wasn't sure but…' energy with a slight surprised warmth"
        : "high-energy excited reveal",
      vibe: isSkeptic ? "honest review" : "haul reveal",
      lighting: "soft natural daylight",
      scene:
        "An aesthetic bedroom with a mirror, a shopping bag visible nearby, neutral linens, soft daylight. She stands at full-body framing",
      identityAnchor: `She holds up ${product} with both hands toward the camera so the full item is clearly visible — never obscuring her face.`,
      reactionsByBeat: countReactionsForDuration(vars.duration, [
        isSkeptic
          ? "calm honest expression, lifts the item up beside her, small considering nod"
          : "excited eyes-wide reaction, lifts the item up beside her face, slight bounce",
        isSkeptic
          ? "warm surprised half-smile, eyes meet camera, item still in frame"
          : "big genuine smile, turns the item slightly, full of energy",
        isSkeptic
          ? "small nod, easy satisfied smile, lowers item slightly"
          : "proud confident close, holds the item to camera one last time, beaming",
      ]),
      ambient: "soft daylight steady, hair moves slightly, fabric shifts as she handles the item.",
    });
  },

  // ---- Testimonial / skeptic ----
  testimonial: (vars, style) => {
    const product = productClause(vars.productName);
    const isStorytime = style.key === "storytime";
    return buildTalkingHead({
      vars,
      style,
      openingFormat: `${isStorytime ? "story-time" : "candid testimonial"} talking-head UGC`,
      energy: isStorytime
        ? "relaxed storyteller energy"
        : "candid 'okay I'm actually impressed' energy with slight surprise",
      vibe: isStorytime ? "telling a friend" : "honest review",
      lighting: "warm soft home light",
      scene:
        "A cozy living room — soft couch, a mug or notebook nearby, warm window light. She sits comfortably, relaxed posture",
      identityAnchor: `${product} sits beside her or in her hand, casually present without dominating the frame.`,
      reactionsByBeat: countReactionsForDuration(vars.duration, [
        isStorytime
          ? "settles in, warm easy smile, light hand gesture"
          : "calm honest look, small considering pause",
        isStorytime
          ? "leans in slightly, gestures naturally with one hand, eyes meet camera"
          : "slightly surprised half-smile, eyebrows lift gently, small nod",
        isStorytime
          ? "easy satisfied smile, soft warm close"
          : "won-over warm expression, small confident close",
      ]),
      ambient: "warm light steady, hair drifts slightly, soft ambient room tone.",
    });
  },

  // ---- Faceless unboxing (always silent) ----
  unboxing: (vars, style) => {
    const product = productClause(vars.productName) || "the product";
    const isCalm = style.key === "calm_asmr";
    return buildFaceless({
      vars,
      openingFormat: `unboxing ASMR UGC, top-down POV of hands opening a ${isCalm ? "package" : "branded mailer"} on a clean surface`,
      energy: isCalm
        ? "satisfying calm energy"
        : "satisfying paced energy, slightly quicker reveal",
      scene: `A clean light-wood table — ${product} centered, two hands enter frame. Soft daylight from the side, gentle shadows.`,
      identityAnchor: `${product} is the focal item; framing stays top-down or shoulder-down throughout — ABSOLUTELY NO FACE in the frame, no head, no shoulders above the chest.`,
      beatActions: countReactionsForDuration(vars.duration, [
        "hands peel the package open, tissue paper visible inside (sound: tape peeling, paper rustling)",
        isCalm
          ? `hands lift ${product} out and unfold it once (sound: soft fabric)`
          : `hands lift ${product} out, unfold and turn it (sound: soft fabric, quick rustle)`,
        isCalm
          ? `hands hold ${product} flat to fill the frame, smoothing it once (sound: gentle fabric)`
          : `hands hold ${product} up to fill the frame, product face toward camera as the hero shot (sound: gentle fabric)`,
      ]),
      ambient: "tissue paper shifts, soft fabric movement, quiet room tone.",
    });
  },

  // ---- Before / after ----
  before_after: (vars, style) => {
    const product = productClause(vars.productName);
    const isResultsFirst = style.key === "results_first";
    return buildTalkingHead({
      vars,
      style,
      openingFormat: "before-after talking-head UGC",
      energy: isResultsFirst
        ? "confident 'look at this' energy with quiet pride"
        : "confident 'look at the result' energy, glowing satisfied",
      vibe: isResultsFirst ? "results first" : "glow up",
      lighting: "flattering soft beauty light",
      scene:
        "A clean bright bathroom or vanity — soft window light, mirror visible, fresh neutral surfaces. She stands or sits close to the camera, mirror-selfie framing",
      identityAnchor: `${product} is held or placed visibly near her as the cause of the result.`,
      reactionsByBeat: countReactionsForDuration(vars.duration, [
        isResultsFirst
          ? "direct calm look at camera, slight confident smile"
          : "glowing satisfied expression, slight head tilt to show the result",
        isResultsFirst
          ? "small head tilt presenting the result, light fingertip touch near her face"
          : "small nod, gentle gesture toward the product, eyes meet camera",
        isResultsFirst
          ? "lifts the product into frame, warm proud close"
          : "subtle confident smile, product clearly in frame, satisfied close",
      ]),
      ambient: "soft daylight steady, hair drifts slightly, light shifts gently on her skin.",
    });
  },

  // ---- Demo / how-to ----
  demo: (vars, style) => {
    const product = productClause(vars.productName);
    const isHowTo = style.key === "how_to";
    return buildTalkingHead({
      vars,
      style,
      openingFormat: `${isHowTo ? "how-to tutorial" : "casual demo"} talking-head UGC`,
      energy: isHowTo
        ? "calm focused tutorial energy"
        : "casual narrating-along energy",
      vibe: isHowTo ? "tutorial" : "casual demo",
      lighting: "natural everyday lighting",
      scene:
        "A clean everyday setting — kitchen counter, bathroom vanity or desk depending on the product. She is close to camera, mid-action with the product",
      identityAnchor: `She actively uses ${product} mid-action throughout, hands and product clearly in frame.`,
      reactionsByBeat: countReactionsForDuration(vars.duration, [
        isHowTo
          ? "shows the product to camera, calm explanatory expression"
          : "mid-action with the product, casual focused look",
        isHowTo
          ? "demonstrates one specific step with the product, clear hand motion"
          : "continues the action, glances up at camera with easy smile",
        isHowTo
          ? "finishes the step, small confident nod, product clearly visible"
          : "completes the action, satisfied half-smile, product in final frame",
      ]),
      ambient: "natural light steady, slight handheld movement, ambient room tone.",
    });
  },
};

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------

/** Trim/sanitize user dialogue for safe embedding in the prompt. */
function sanitizeDialogue(dialogue: string): string {
  return dialogue.replace(/["\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 240);
}

/**
 * Build a short "the {product}" clause for embedding in templates.
 * Empty when no product name is known — templates degrade gracefully
 * to "the item" / "the product".
 */
function productClause(name?: string): string {
  const trimmed = (name || "").trim().slice(0, 80);
  if (!trimmed) return "the item";
  // Guard against double-articles ("the the …"). If user already
  // typed an article, keep it; otherwise prepend "the".
  if (/^(the|a|an)\s/i.test(trimmed)) return trimmed;
  return `the ${trimmed}`;
}

/**
 * Slice/extend a reaction list to match the actual beat count for
 * the chosen duration. Templates always supply 3 reactions; this
 * collapses to 2 for short clips by joining beats 1 + 2.
 */
function padBeats(reactions: string[], count: number): string[] {
  if (reactions.length === count) return reactions;
  if (reactions.length > count) {
    // Take first + last; drop middle (or middles).
    return [reactions[0], reactions[reactions.length - 1]];
  }
  // Repeat last reaction to fill (shouldn't normally happen — all
  // templates supply 3).
  const out = [...reactions];
  while (out.length < count) out.push(reactions[reactions.length - 1] || "");
  return out;
}

/**
 * Helper for the builders — always returns the right number of
 * reactions for the duration's beat count. Builders supply 3,
 * this returns 2 or 3.
 */
function countReactionsForDuration(duration: number, three: string[]): string[] {
  return padBeats(three, beats(duration).length);
}

// ----------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------

export function hookStylesFor(angleKey: AdAngleKey): HookStyle[] {
  return HOOK_STYLES[angleKey] || HOOK_STYLES.lifestyle_hold;
}

export function defaultHookStyle(angleKey: AdAngleKey): HookStyle {
  return hookStylesFor(angleKey)[0];
}

export function resolveHookStyle(
  angleKey: AdAngleKey,
  hookStyleKey?: HookStyleKey,
): HookStyle {
  const styles = hookStylesFor(angleKey);
  return styles.find((s) => s.key === hookStyleKey) || styles[0];
}

/**
 * Build the full Seedance 2.0 prompt from user inputs. Single entry
 * point — UI and server both go through here so the prompt the user
 * sees in the "Advanced" preview is exactly what the server sends.
 */
export function buildSeedancePrompt(vars: BuildVars): string {
  const style = resolveHookStyle(vars.angleKey, vars.hookStyleKey);
  const builder = BUILDERS[vars.angleKey] || BUILDERS.lifestyle_hold;
  return builder(vars, style);
}
