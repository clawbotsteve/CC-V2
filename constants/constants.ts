export const INTERNAL_DASHBOARD_TOKEN = 'yebeud7dnj3nu3immmms';

export const SAFETY_LEVELS: Record<number, string> = {
  1: "Most Strict",
  2: "Strict",
  3: "Moderate",
  4: "Permissive",
  5: "Most Permissive",
  6: "No Filter",
};


export const NEGATIVE_PROMPTS: string[] = [
  "low quality, worst quality, poor quality, pixelated",
  "deformed, distorted, disfigured",
  "bad anatomy, extra limbs, missing limbs, extra digits, extra fingers, extra toes, more than five digits, more than five fingers per hand, more than five toes per hand, more than two arms, more than two legs",
  "text, watermark, signature",
  "blurry, out of focus, unblended",
  "killing, death, blood, gore, racism, murder, rape, kill, unalive, kkk, antisemetic, nazi",
];

export const NSFW_CHILD_SAFETY_PROMPTS: string[] = [
  "child, children, kid, kids, minor, underage, under 18",
  "baby, infant, toddler, small child",
  "teen, teenager, adolescent, preteen",
  "family, families, parents with kids, mother and child, father and child",
  "school, classroom, playground, student uniform, schoolgirl, schoolboy",
  "loli, shota, juvenile",
];

export const DEFAULT_NEGATIVE_PROMPT = NEGATIVE_PROMPTS.join(", ");
export const NSFW_NEGATIVE_PROMPT = [...NEGATIVE_PROMPTS, ...NSFW_CHILD_SAFETY_PROMPTS].join(", ");