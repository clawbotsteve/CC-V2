import { ErrorPayload } from "./types";

interface Image {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
  width: number;
  height: number;
}

interface Timings {
  queue_time_ms: number;
  processing_time_ms: number;
  total_time_ms: number;
}

interface Upscale {
  image: Image;
  seed: number;
  timings: Timings;
}


export type FalImageUpscaleOutput =
  | {
    status: "OK";
    error: null;
    gateway_request_id: string;
    payload: Upscale;
    request_id: string;
  }
  | {
    status: "ERROR";
    error: string;
    gateway_request_id: string;
    payload: ErrorPayload;
    request_id: string;
  };


export enum UpscaleModel {
  TopazImage = "fal-ai/topaz/upscale/image",
  SeedVrImage = "fal-ai/seedvr/upscale/image",
  BytedanceVideo = "fal-ai/bytedance-upscaler/upscale/video",
}

export type ClarityUpscalerInput = {
  model: UpscaleModel;
  image_url: string;
  video_url?: string;
  prompt: string;
  negative_prompt?: string;
  upscale_factor: number;
  target_resolution?: "1080p" | "2k" | "4k" | "720p" | "1440p" | "2160p";
  target_fps?: "30fps" | "60fps";
  creativity?: number;
  resemblance?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  enable_safety_checker?: boolean;
  referenceImage?: File;
  referenceVideo?: File;
};

export type ClarityUpscalerForm = ClarityUpscalerInput;

export const defaultClarityUpscalerForm: ClarityUpscalerForm = {
  model: UpscaleModel.SeedVrImage,
  image_url: "",
  video_url: undefined,
  prompt: "Enhance quality while preserving details", 
  negative_prompt: "",
  upscale_factor: 2.0,
  target_resolution: undefined,
  target_fps: "30fps",
  creativity: 0.5,
  resemblance: 0.5,
  guidance_scale: 7.5,
  num_inference_steps: 50,
  seed: 42,
  enable_safety_checker: false,
  referenceImage: undefined,
  referenceVideo: undefined,
};

export function getUpscaleVariant(input: Pick<ClarityUpscalerInput, "model" | "target_resolution" | "target_fps">): string {
  if (input.model === UpscaleModel.BytedanceVideo) {
    const res = input.target_resolution ?? "1080p";
    const fps = input.target_fps ?? "30fps";
    return `video_upscale_bytedance_${res}_${fps}`;
  }
  if (input.model === UpscaleModel.TopazImage) {
    return "image_upscale_topaz";
  }
  return "image_upscale_seedvr";
}
