import { VideoVariant } from "@prisma/client";
import { Duration, ErrorPayload, SeedanceResolution, VideoModel } from "./types";

// Seedance 2.0 supported duration range (per FAL: 4-15 seconds).
export const SEEDANCE_DURATION_MIN = 4;
export const SEEDANCE_DURATION_MAX = 15;
export const SEEDANCE_DEFAULT_DURATION = 5;
export const SEEDANCE_DEFAULT_RESOLUTION: SeedanceResolution = "720p";

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
  // Most models use Duration.Five|Ten. Seedance 2.0 supports any int 4-15
  // (validated server-side); we widen the type to `number` to allow that.
  duration?: number;
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
  /** Seedance 2.0 only — output resolution. Drives both the FAL request
   *  and the credit-cost variant lookup (see getVideoCreditVariant). */
  seedance_resolution?: SeedanceResolution;
};

export type VideoGenerationForm = VideoGenerationInput;

export const defaultVideoGenerationForm: VideoGenerationForm = {
  cfg_scale: 0.75,
  duration: Duration.Five,
  enable_safety_checker: true,
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
  seedance_resolution: SEEDANCE_DEFAULT_RESOLUTION,
};

/**
 * Helper function to determine the correct DB-level variant based on model and duration.
 * The returned VideoVariant is what gets persisted on GeneratedVideo for analytics
 * grouping. Credit-cost lookup uses getVideoCreditVariant() below, which can return
 * arbitrary strings (allowing per-model variants without expanding the schema enum).
 */
export function getVideoVariant(model: VideoModel, duration?: Duration): VideoVariant {
  if (model === VideoModel.Bytedance) {
    return duration === Duration.Ten ? VideoVariant.nsfw_10s : VideoVariant.nsfw_5s;
  }

  if (
    model === VideoModel.Kling ||
    model === VideoModel.KlingMotionControl ||
    model === VideoModel.Seedance2Ref
  ) {
    return duration === Duration.Ten ? VideoVariant.standard_10s : VideoVariant.standard_5s;
  }

  if (model === VideoModel.Veo) {
    return duration === Duration.Ten ? VideoVariant.veo_8s : VideoVariant.veo_4s;
  }

  return VideoVariant.standard_5s;
}

export function getVideoCreditVariant(
  input: Pick<
    VideoGenerationInput,
    "model" | "duration" | "generate_audio" | "variant" | "seedance_resolution"
  >
): string {
  if (input.model === VideoModel.Kling) {
    const d = input.duration === Duration.Ten ? "10s" : "5s";
    return input.generate_audio === false ? `kling_silent_${d}` : `kling_audio_${d}`;
  }
  if (input.model === VideoModel.Seedance2Ref) {
    // Resolution-aware variant. Cost is computed dynamically as
    // (perSecondCost × duration) — see lib/get-credit-cost.ts.
    const res: SeedanceResolution = input.seedance_resolution ?? SEEDANCE_DEFAULT_RESOLUTION;
    const dur = clampSeedanceDuration(input.duration);
    return `seedance_v2_ref_${res}_${dur}s`;
  }
  return input.variant;
}

/** Defensive clamp — UI slider already restricts 4-15, but server must
 *  validate too. Falls back to default if duration is missing/invalid. */
export function clampSeedanceDuration(duration?: number): number {
  if (typeof duration !== "number" || !Number.isFinite(duration)) {
    return SEEDANCE_DEFAULT_DURATION;
  }
  const rounded = Math.round(duration);
  if (rounded < SEEDANCE_DURATION_MIN) return SEEDANCE_DURATION_MIN;
  if (rounded > SEEDANCE_DURATION_MAX) return SEEDANCE_DURATION_MAX;
  return rounded;
}

// Re-export VideoModel for convenience
export { VideoModel } from "./types";
