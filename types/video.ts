import { VideoVariant } from "@prisma/client";
import { Duration, ErrorPayload, VideoModel } from "./types";

interface Video {
  video: {
    url: string;
  };
}

export type FalVideoGenerationOutput =
  | {
    status: "OK";
    error: null;
    gateway_request_id: string;
    payload: Video;
    request_id: string;
  }
  | {
    status: "ERROR";
    error: string;
    gateway_request_id: string;
    payload: ErrorPayload;
    request_id: string;
  };


interface KlingInput {
  cfg_scale?: number;
  duration: Duration;
  image_url: string;
  negative_prompt?: string;
  prompt: string;
};

interface WanInput {
  enable_safety_checker: boolean;
  image_url: string;
  prompt: string;
  seed: number;
};

export enum VideoAspectRatio {
  portrait = "9:16",
  landscape = "16:9",
  hd_4k = "4:3"
}


export type VideoGenerationInput = {
  cfg_scale?: number;
  duration?: Duration;
  enable_safety_checker?: boolean;
  generate_audio?: boolean;
  keep_original_sound?: boolean;
  image_url: string;
  video_url?: string; // Required for Kling Motion Control
  aspect_ratio: VideoAspectRatio;
  model: VideoModel,
  negative_prompt?: string;
  prompt: string;
  referenceImage?: File;
  referenceVideo?: File; // Required for Kling Motion Control
  seed?: number;
  variant: VideoVariant;
  character_orientation?: "image" | "video"; // For Kling Motion Control
};

export type VideoGenerationForm = VideoGenerationInput;

export const defaultVideoGenerationForm: VideoGenerationForm = {
  cfg_scale: 0.75,
  duration: Duration.Five,
  enable_safety_checker: false,
  generate_audio: true,
  keep_original_sound: true,
  image_url: "",
  video_url: undefined,
  aspect_ratio: VideoAspectRatio.portrait,
  model: VideoModel.Kling,
  negative_prompt: "",
  prompt: "",
  referenceImage: undefined,
  referenceVideo: undefined,
  seed: Math.floor(Math.random() * 9_000_000) + 1_000_000,
  variant: VideoVariant.standard_5s,
  character_orientation: "image",
};

/**
 * Helper function to determine the correct variant based on model and duration
 */
export function getVideoVariant(model: VideoModel, duration?: Duration): VideoVariant {
  if (model === VideoModel.Bytedance) {
    return duration === Duration.Ten ? VideoVariant.nsfw_10s : VideoVariant.nsfw_5s;
  }

  if (model === VideoModel.Kling || model === VideoModel.KlingMotionControl) {
    return duration === Duration.Ten ? VideoVariant.standard_10s : VideoVariant.standard_5s;
  }

  if (model === VideoModel.Veo) {
    return duration === Duration.Ten ? VideoVariant.veo_8s : VideoVariant.veo_4s;
  }

  return VideoVariant.standard_5s;
}

export function getVideoCreditVariant(input: Pick<VideoGenerationInput, "model" | "duration" | "generate_audio" | "variant">): string {
  if (input.model === VideoModel.Kling) {
    const d = input.duration === Duration.Ten ? "10s" : "5s";
    return input.generate_audio === false ? `kling_silent_${d}` : `kling_audio_${d}`;
  }
  return input.variant;
}

// Re-export VideoModel for convenience
export { VideoModel } from "./types";
