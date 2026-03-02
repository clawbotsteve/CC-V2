import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import prismadb from "./prismadb";
import { randomUUID } from "crypto";
import { AspectRatio } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  const cleanPath = `/${path.replace(/^\/+/, "")}`;
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    process.env.APP_URL?.replace(/\/+$/, "") ||
    `http://localhost:${process.env.PORT || 3000}`;

  return `${base}${cleanPath}`;
}

export async function getSubscriptionPlanIdByTier(tier: string): Promise<string | null> {
  const plan = await prismadb.subscriptionTier.findUnique({
    where: { tier },
    select: { id: true },
  });

  if (!plan) return null;

  return plan.id;
}


type UploadResponse = {
  message: string;
  files: {
    name: string;
    url: string;
    type: "local" | "s3";
  }[];
};

type UploadError = {
  error: string;
};

export async function uploadFiles({
  files,
  maxFiles = 10,
  allowedTypes = [],
}: {
  files: File[];
  maxFiles?: number;
  allowedTypes?: string[];
}): Promise<UploadResponse | UploadError> {
  try {
    const formData = new FormData();

    formData.append("maxFiles", String(maxFiles));
    formData.append("allowedTypes", JSON.stringify(allowedTypes));

    console.log("[DEBUG] Utils: ", files)

    files.forEach((file) => {
      formData.append("files", file); // same key for all files
    });

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return response.ok ? data : { error: data.error || "Upload failed" };
  } catch (err) {
    console.error("Upload error:", err);
    return { error: "Something went wrong during upload" };
  }
}

export async function getRawBodyFromStream(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
}

// lib/utils/webhook.ts

export function getWebhookUrl(path: string): string {
  const isDev = process.env.NODE_ENV === "development";

  const baseUrl = isDev
    ? process.env.NGROK_TUNNEL_URL || process.env.NEXT_PUBLIC_APP_URL
    : process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    // For local development without ngrok, return localhost URL
    // The fal-client will skip it if it's localhost
    const localhostUrl = `http://localhost:3001/${path.replace(/^\//, "")}`;
    console.warn(`[WEBHOOK URL] No base URL configured, using localhost: ${localhostUrl}`);
    return localhostUrl;
  }

  // Clean up slashes
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  
  if (isDev) {
    console.log(`[WEBHOOK URL] Generated webhook URL: ${webhookUrl}`);
  }
  
  return webhookUrl;
}


/**
 * Replaces {{placeholders}} in a template string with actual values from a data object.
 * @param template - The template string with {{placeholders}}.
 * @param data - An object containing key-value pairs for replacement.
 * @returns A string with all placeholders replaced.
 */
export function compilePrompt(template: string, data: Record<string, string>): string {
  return Object.entries(data).reduce((compiled, [key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    return compiled.replace(placeholder, value);
  }, template);
}

const maleVoices = [
  "Roger", "Charlie", "George", "Callum", "Liam", "Will", "Eric", "Chris", "Brian", "Daniel", "Bill",
] as const;

const femaleVoices = [
  "Aria", "Sarah", "Laura", "Charlotte", "Alice", "Matilda", "Jessica", "Lily",
] as const;

type AiAvatarVoice = (typeof maleVoices)[number] | (typeof femaleVoices)[number];

export function getRandomVoice(gender: "male" | "female"): AiAvatarVoice {
  const voices = gender === "male" ? maleVoices : femaleVoices;
  return voices[Math.floor(Math.random() * voices.length)];
}


type SimpleFile = {
  name: string;
};

export function makeUrlFriendlyFilename(file: SimpleFile): string {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || '';
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

  const safeName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${timestamp}-${randomUUID()}-${safeName}.${ext}`;
}

export function updateForm<T>(setForm: React.Dispatch<React.SetStateAction<T>>, data: Partial<T>) {
  setForm(prev => ({ ...prev, ...data }));
}

export function getAspectClass(ratio: AspectRatio): string {
  switch (ratio) {
    case "square":
      return "1/1";
    case "portrait_4_3":
      return "3/4";
    case "portrait_16_9":
      return "9/16";
    case "landscape_4_3":
      return "4/3";
    case "landscape_16_9":
      return "16/9";
    default:
      return "1/1"; // fallback
  }
}
