import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { moderateAndLog } from "@/lib/content-moderation";

// Use OpenAI directly (was fal.subscribe("fal-ai/any-llm", ...) — 2026-05-31).
// Our FAL API key no longer has access after the FAL→Replicate migration,
// so the FAL proxy returned 403 Forbidden, caught by the outer try/catch
// here, and surfaced as the generic "Failed to build your prompt" toast
// in the onboarding modal. OPENAI_API_KEY is already set on Railway for
// content moderation and other paths — reuse it.
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Build a polished GPT Image 2 prompt from the onboarding answers.
 *
 * The synthesizer is hard-constrained against:
 *   - real / identifiable people (compliance — defense in depth, the
 *     Phase 2 moderation pipeline also blocks these at gen time)
 *   - any-age ambiguity (always 21+, our youngest age bucket starts at 21)
 *   - NSFW (platform is SFW-only as of 2026-04-29)
 *
 * Output is a single 1–3 sentence prompt string, no preamble.
 */

const SYSTEM_PROMPT = `You are an expert AI image prompt engineer for OpenAI's GPT Image 2 model.
You write prompts that produce a fictional, original character based on the user's preferences.

Hard rules — never violate:
1. Always describe a fictional, ORIGINAL character. Never reference real people, celebrities, athletes, politicians, or historical figures.
2. The character is always at least 21 years old. Never describe minors, teens, or anyone of ambiguous age.
3. Output is always SFW. Tasteful, professional, fully clothed. No nudity, no sexual content, no provocative posing.
4. No copyrighted characters or franchises (Disney, anime IP, video-game IP, etc.).

Style rules:
- Output a single image prompt, 1–3 sentences, no preamble or explanation, no quotes.
- Always include cues for high-quality output: e.g., "professional photography, sharp focus, cinematic lighting, magazine-quality detail".
- If the user picked "Attractive" or "Supermodel" style, lean into editorial / fashion-photography aesthetic — confident pose, professional lighting, magazine-cover composition. Tasteful, never lewd.
- Match the user's chosen goal: an AI Influencer prompt should feel social-media-ready; a Character prompt should feel narrative; a Self-portrait should feel personal/portrait-oriented.

You will receive the user's answers as JSON. Build the prompt.`;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const answers = await req.json();
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    // Build a compact natural-language hint from the answers. The LLM
    // produces a much better prompt with this than with raw JSON.
    const hint = buildAnswerSummary(answers);

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: hint },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const raw = completion.choices?.[0]?.message?.content;
    let prompt = typeof raw === "string" ? raw.trim() : "";

    // Strip any wrapping quotes the LLM may have added.
    prompt = prompt.replace(/^["'""']+|["'""']+$/g, "").trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Couldn't build a prompt from those answers — please try again." },
        { status: 502 }
      );
    }

    // Belt-and-suspenders: run the synthesized prompt through the same
    // moderation pipeline every gen endpoint uses. If the LLM returned
    // something that trips a flag (it shouldn't, given the system prompt),
    // we fail closed and ask the user to adjust.
    const moderation = await moderateAndLog({
      userId,
      endpoint: "onboarding.synthesize-prompt",
      prompt,
    });
    if (!moderation.allowed) {
      return NextResponse.json(
        {
          error:
            "We couldn't build a safe prompt from those answers. Try different choices?",
          flags: moderation.flags,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (err: any) {
    console.error("[ONBOARDING] synthesize-prompt error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to build your prompt. Please try again." },
      { status: 500 }
    );
  }
}

function buildAnswerSummary(answers: any): string {
  const parts: string[] = [];

  switch (answers.goal) {
    case "influencer":
      parts.push("Goal: an AI influencer / social-media-ready model.");
      break;
    case "character":
      parts.push("Goal: a fictional character for a story or game.");
      break;
    case "self":
      parts.push("Goal: a personal portrait avatar.");
      break;
    default:
      parts.push("Goal: a polished portrait of an original character.");
  }

  if (answers.gender) parts.push(`Gender presentation: ${answers.gender}.`);
  if (answers.ageRange) parts.push(`Age range: ${answers.ageRange} (always at least 21).`);
  if (answers.skinTone) parts.push(`Skin tone: ${answers.skinTone}.`);
  if (answers.hairLength || answers.hairColor) {
    const len = answers.hairLength ? `${answers.hairLength}-length` : "";
    const color = answers.hairColor ? answers.hairColor : "";
    parts.push(`Hair: ${[len, color].filter(Boolean).join(" ")}.`.replace(/\s+/g, " "));
  }
  if (answers.eyeColor) parts.push(`Eye color: ${answers.eyeColor}.`);
  if (answers.style) parts.push(`Style / vibe: ${answers.style}.`);

  parts.push(
    "Produce a single image generation prompt (1–3 sentences) that follows your system rules. No preamble, no quotes."
  );

  return parts.join(" ");
}
