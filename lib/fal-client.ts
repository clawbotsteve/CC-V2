import { fal } from "@fal-ai/client";
import { DEFAULT_NEGATIVE_PROMPT, NSFW_NEGATIVE_PROMPT } from "@/constants/constants";
import { readFile } from "fs/promises";
import { join } from "path";


fal.config({
  credentials: process.env.FAL_API_KEY!,
});

export async function submitFalJob(
  endpoint: string,
  options: {
    input: any;
    webhookUrl: string;
  }
) {
  const { input, webhookUrl } = options;
  const enhancedInput = { ...input };
  const isNSFW = input.enable_safety_checker === false;
  
  const basePrompt = isNSFW ? NSFW_NEGATIVE_PROMPT : DEFAULT_NEGATIVE_PROMPT;
  
  enhancedInput.negative_prompt = input.negative_prompt
      ? `${input.negative_prompt}, ${basePrompt}`
      : basePrompt;

  // For local development, webhook URL might be localhost which fal-ai can't reach
  // The status endpoint will poll fal-ai directly as a fallback
  const submitOptions: any = {
    input: enhancedInput,
  };

  // Only include webhookUrl if it's not localhost (for production/staging)
  if (webhookUrl && !webhookUrl.includes('localhost') && !webhookUrl.includes('127.0.0.1')) {
    submitOptions.webhookUrl = webhookUrl;
    console.log(`[FAL CLIENT] Webhook URL set: ${webhookUrl}`);
  } else {
    console.warn(`[FAL CLIENT] Skipping webhook URL for local development: ${webhookUrl}. Polling will be used as fallback.`);
  }

  return fal.queue.submit(endpoint, submitOptions);
}

export async function getFalJobStatus(endpoint: string, requestId: string) {
  return fal.queue.status(endpoint, { requestId });
}

export async function getFalJobResult(endpoint: string, requestId: string) {
  return fal.queue.result(endpoint, { requestId });
}

function contentTypeFromPath(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".gif")) return "image/gif";
  if (p.endsWith(".mp4")) return "video/mp4";
  if (p.endsWith(".webm")) return "video/webm";
  if (p.endsWith(".mov")) return "video/quicktime";
  return "image/jpeg";
}

export async function uploadImageUrlToFalStorage(url: string): Promise<string> {
  // Handle local app paths like /uploads/abc.png by reading from disk directly.
  if (url.startsWith("/")) {
    const diskPath = join(process.cwd(), "public", url.replace(/^\//, ""));
    const buffer = await readFile(diskPath);
    const blob = new Blob([buffer], { type: contentTypeFromPath(url) });
    return fal.storage.upload(blob);
  }

  // Handle absolute URLs (including localhost) by downloading then re-uploading to Fal storage.
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch source image: ${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();
  return fal.storage.upload(blob);
}
