import { PromptGenerationInput } from "@/types/prompt";

export function createPromptJob(input: PromptGenerationInput): PromptGenerationInput {
  const requiredFields: (keyof PromptGenerationInput)[] = [
    "input_concept",
    "style",
    "model",
    "prompt_length",
    "image_url"
  ];

  for (const field of requiredFields) {
    const value = input[field];
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "string" && value.trim() === "")
    ) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return input;
}
