import OpenAI from "openai";
import { PLATFORM_SAFETY_NEGATIVE_PROMPT } from "@/constants/constants";

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

/**
 * Pre-flight moderation for any user-supplied prompt.
 * Phase 1: local blocklist + OpenAI moderation API.
 * Phase 2 will add a real-person classifier (GPT-4o-mini).
 */
export async function moderatePrompt(prompt: string): Promise<ModerationResult> {
  if (!prompt || !prompt.trim()) {
    return { allowed: true, reason: null, flags: [] };
  }

  const flags: ModerationFlag[] = [];

  flags.push(...checkBlocklist(prompt));

  try {
    flags.push(...(await checkOpenAIModeration(prompt)));
  } catch (err) {
    console.error("[content-moderation] OpenAI moderation call failed:", err);
  }

  if (flags.length > 0) {
    return { allowed: false, reason: USER_FACING_REJECTION, flags };
  }

  return { allowed: true, reason: null, flags: [] };
}
