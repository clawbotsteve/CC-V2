import { AspectRatio, ErrorPayload, ImageSize, OutputFormat, SafetyTolerance } from "./types";

//* Image Output from FAL
export interface Image {
  content_type: string;
  height: number;
  width: number;
  url: string;
};

export interface ExtendedImage extends Image {
  is_nsfw?: boolean;
}

interface FluxLoraOutput {
  images: Image[];
  timings: Record<string, unknown>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
};

export type FalImageOutput =
  | {
    status: "OK";
    error: null;
    gateway_request_id: string;
    payload: FluxLoraOutput;
    request_id: string;
  }
  | {
    status: "ERROR";
    error: string;
    gateway_request_id: string;
    payload: ErrorPayload;
    request_id: string;
  };



//* Image Input
export enum ImageGenerationModel {
  /** OpenAI gpt-image-2 (text-to-image), routed through FAL. Beginner+ tier. */
  GptImage2 = "fal-ai/gpt-image-2",
  /** @deprecated Removed from picker 2026-04-29 (consolidated to gpt-image-2). Enum kept so historical rows resolve. */
  V1 = "fal-ai/flux-pro/v1.1",
  Lora = "fal-ai/flux-lora",
  /** @deprecated Removed from picker 2026-04-29. Enum kept for historical rows. */
  NanoBannaPro = "fal-ai/nano-banana-pro",
  NanoBanana2Base = "fal-ai/nano-banana-2",
  NanoBanana2 = "fal-ai/nano-banana-2/edit",
  Soul2 = "higgsfield-ai/soul/reference",
}

interface CustomImageSize {
  width: number;
  height: number;
}

interface LoraWeight {
  path: string;
  scale: number;
}

export interface V1Input {
  prompt: string;
  seed: number;
  image_size: ImageSize | CustomImageSize;
  sync_mode: boolean;
  num_images: number;
  enable_safety_checker: boolean;
  output_format: OutputFormat;
  safety_tolerance: SafetyTolerance;
}

export interface LoraInput {
  prompt: string;
  seed: number;
  guidance_scale: number;
  image_size: ImageSize | CustomImageSize;
  num_inference_steps: number;
  loras: LoraWeight[];
  sync_mode: boolean;
  num_images: number;
  enable_safety_checker: boolean;
  output_format: OutputFormat;
}

export interface NanoBannaProInput {
  prompt: string;
  image_url?: string;
  seed?: number;
  num_images?: number;
  output_format?: OutputFormat;
  output_resolution?: NanoBananaResolution;
  aspect_ratio?: AspectRatio;
  image_size?: ImageSize | CustomImageSize;
}

export interface Soul2Input {
  prompt: string;
  num_images?: number;
  seed?: number;
  output_format?: OutputFormat;
  aspect_ratio?: AspectRatio;
}

/**
 * Input for openai/gpt-image-2 (text-to-image) via FAL.
 * https://fal.ai/models/openai/gpt-image-2
 *
 * `quality` is server-side forced to "medium" for all paid tiers right now —
 * unit cost balloons at "high" + 4K and would burn through plan margins.
 * If we add a Studio-only HD upsell later, surface this field to the UI.
 */
export type GptImage2Quality = "low" | "medium" | "high";

export interface GptImage2Input {
  prompt: string;
  image_size?: ImageSize | CustomImageSize;
  aspect_ratio?: AspectRatio;
  quality?: GptImage2Quality;
  num_images?: number;
  output_format?: OutputFormat;
  seed?: number;
}

export type NanoBananaResolution = "1k" | "2k" | "4k";

export interface NanoBanana2Input {
  prompt: string;
  num_images?: number;
  seed?: number;
  output_format?: OutputFormat;
  aspect_ratio?: AspectRatio;
  image_size?: ImageSize | CustomImageSize;
  image_urls?: string[];
  output_resolution?: NanoBananaResolution;
}


export interface ImageGenerationInput {
  aspect_ratio?: AspectRatio;
  enable_safety_checker?: boolean;
  guidance_scale?: number;
  image_size?: ImageSize | CustomImageSize;
  image_url?: string;
  image_urls?: string[];
  loras?: LoraWeight[];
  lora_id: string | "none";
  model: ImageGenerationModel;
  num_inference_steps?: number;
  num_images: number;
  output_format: OutputFormat;
  output_resolution?: NanoBananaResolution;
  prompt: string;
  safety_tolerance?: SafetyTolerance;
  seed: number;
  sync_mode?: boolean;
  referenceImage?: File | File[];
}

export type ImageGenerationForm = ImageGenerationInput;

export const defaultImageGenerationForm: ImageGenerationInput = {
  aspect_ratio: undefined,
  // Platform is SFW-only as of 2026-04-29; safety always on.
  enable_safety_checker: true,
  guidance_scale: 3,
  image_size: ImageSize.Portrait16_9,
  image_url: "",
  loras: [],
  lora_id: "none",
  // Default to gpt-image-2 — the entry-level model available on every
  // paid tier (and Free's single-trial credit). Was NanoBannaPro,
  // which was removed from the picker 2026-04-29.
  model: ImageGenerationModel.GptImage2,
  num_inference_steps: 28,
  num_images: 1,
  output_format: OutputFormat.Png,
  output_resolution: "1k",
  prompt: "",
  safety_tolerance: SafetyTolerance.Level6,
  seed: Math.floor(Math.random() * 9_000_000) + 1_000_000,
  sync_mode: false,
  referenceImage: undefined,
};
