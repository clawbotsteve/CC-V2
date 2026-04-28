import OpenAI from "openai";
import { PLATFORM_SAFETY_NEGATIVE_PROMPT } from "@/constants/constants";
import prismadb from "@/lib/prismadb";

export type ModerationFlag =
  | `blocklist:${string}`
  | `openai:${string}`
  | `realperson:${string}`;

export type ModerationResult = {
  allowed: boolean;
  reason: string | null;
  flags: ModerationFlag[];
};

const BLOCKED_TERMS = PLATFORM_SAFETY_NEGATIVE_PROMPT
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

const USER_FACING_REJECTION =
  "Your prompt contains content that violates our safety policy. Please revise and try again.";

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function checkBlocklist(prompt: string): ModerationFlag[] {
  const lower = prompt.toLowerCase();
  return BLOCKED_TERMS
    .filter((term) => lower.includes(term))
    .map((term) => `blocklist:${term}` as ModerationFlag);
}

async function checkOpenAIModeration(prompt: string): Promise<ModerationFlag[]> {
  const client = getOpenAI();
  if (!client) return [];

  const result = await client.moderations.create({
    model: "omni-moderation-latest",
    input: prompt,
  });

  const flags: ModerationFlag[] = [];
  for (const r of result.results) {
    if (!r.flagged) continue;
    for (const [category, isFlagged] of Object.entries(r.categories)) {
      if (isFlagged) flags.push(`openai:${category}` as ModerationFlag);
    }
  }
  return flags;
}

const REAL_PERSON_SYSTEM_PROMPT = `You detect references to real, identifiable living or recently-deceased public figures (politicians, celebrities, athletes, musicians, actors, business leaders, royalty, internet personalities, etc.) in image/video generation prompts.

Respond ONLY with JSON: {"hasRealPerson": boolean, "names": string[]}.

Return hasRealPerson: true if the prompt names or unambiguously identifies any real public figure. Generic descriptions ("a woman with red hair", "a CEO") are NOT real people. Fictional characters (Mickey Mouse, Harry Potter) are NOT real people for this check. Historical figures dead 100+ years (Napoleon, Lincoln) are NOT real people for this check. If uncertain, return false.`;

async function checkRealPerson(prompt: string): Promise<ModerationFlag[]> {
  const client = getOpenAI();
  if (!client) return [];

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 200,
    messages: [
      { role: "system", content: REAL_PERSON_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return [];

  let parsed: { hasRealPerson?: boolean; names?: string[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!parsed.hasRealPerson || !Array.isArray(parsed.names)) return [];

  return parsed.names
    .filter((n) => typeof n === "string" && n.trim())
    .map((n) => `realperson:${n.trim()}` as ModerationFlag);
}

/**
 * Pre-flight moderation for any user-supplied prompt.
 *   1. Local blocklist
 *   2. OpenAI moderation API (omni-moderation-latest)
 *   3. Real-person classifier (gpt-4o-mini, JSON mode)
 *
 * Layers run in parallel after the blocklist; if blocklist matches we skip
 * remote calls. Caller decides what to do with `flags` (block + log, or
 * block-and-flag-for-review depending on context).
 */
export async function moderatePrompt(prompt: string): Promise<ModerationResult> {
  if (!prompt || !prompt.trim()) {
    return { allowed: true, reason: null, flags: [] };
  }

  const blocklistFlags = checkBlocklist(prompt);
  if (blocklistFlags.length > 0) {
    return { allowed: false, reason: USER_FACING_REJECTION, flags: blocklistFlags };
  }

  const [moderationFlags, realPersonFlags] = await Promise.all([
    checkOpenAIModeration(prompt).catch((err) => {
      console.error("[content-moderation] OpenAI moderation call failed:", err);
      return [] as ModerationFlag[];
    }),
    checkRealPerson(prompt).catch((err) => {
      console.error("[content-moderation] Real-person classifier failed:", err);
      return [] as ModerationFlag[];
    }),
  ]);

  const flags = [...moderationFlags, ...realPersonFlags];
  if (flags.length > 0) {
    return { allowed: false, reason: USER_FACING_REJECTION, flags };
  }

  return { allowed: true, reason: null, flags: [] };
}

export async function logModeration(params: {
  userId: string | null;
  endpoint: string;
  prompt: string;
  result: ModerationResult;
}): Promise<void> {
  try {
    await prismadb.moderationLog.create({
      data: {
        userId: params.userId,
        endpoint: params.endpoint,
        prompt: params.prompt,
        allowed: params.result.allowed,
        flags: params.result.flags,
        reason: params.result.reason,
      },
    });
  } catch (err) {
    console.error("[content-moderation] Failed to write ModerationLog:", err);
  }
}

/**
 * Convenience wrapper: run moderation, write audit log, return the decision.
 * Use this from generation endpoints — one call replaces the moderate-then-log pattern.
 */
export async function moderateAndLog(params: {
  userId: string | null;
  endpoint: string;
  prompt: string;
}): Promise<ModerationResult> {
  const result = await moderatePrompt(params.prompt);
  await logModeration({ ...params, result });
  return result;
}
