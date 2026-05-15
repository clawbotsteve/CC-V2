import prismadb from "@/lib/prismadb";

export type InfluencerWithOwner = Awaited<ReturnType<typeof prismadb.influencer.findFirst>> & {
  owner: "self" | "external";
};

export interface ErrorDetail {
  loc: string[];
  msg: string;
  type: string;
  ctx?: {
    given?: any;
    permitted?: any[];
  };
}

// Error payload
export interface ErrorPayload {
  detail: ErrorDetail[];
}


export enum Acceleration {
  None = "none",
  Regular = "regular",
  High = "high",
}

export enum OutputFormat {
  Png = "png",
  Jpeg = "jpeg",
}

export enum SafetyTolerance {
  Level1 = "1",
  Level2 = "2",
  Level3 = "3",
  Level4 = "4",
  Level5 = "5",
  Level6 = "6",
}

export enum AspectRatio {
  Ratio21_9 = "21:9",
  Ratio16_9 = "16:9",
  Ratio4_3 = "4:3",
  Ratio3_2 = "3:2",
  Ratio1_1 = "1:1",
  Ratio2_3 = "2:3",
  Ratio3_4 = "3:4",
  Ratio9_16 = "9:16",
  Ratio9_21 = "9:21",
}

export enum ImageSize {
  SquareHD = "square_hd",
  Square = "square",
  Portrait4_3 = "portrait_4_3",
  Portrait16_9 = "portrait_16_9",
  Landscape4_3 = "landscape_4_3",
  Landscape16_9 = "landscape_16_9",
}

export enum UserGender {
  Male = "male",
  Female = "female",
}

export enum WorkflowType {
  UserHair = "user_hair",
  TargetHair = "target_hair",
}

// Kept as numeric enum so Duration.Five === 5 and ===10 comparisons stay
// type-safe. Seedance 2.0 supports 4-15s and uses raw `number` instead of
// this enum (see `seedance_duration` on VideoGenerationInput).
export enum Duration {
  Five = 5,
  Ten = 10,
}

/** Seedance 2.0 reference-to-video supports these three resolutions per FAL.
 *  Higher = more expensive (see CREDIT_COSTS.SEEDANCE_V2_REF_*_PER_SEC). */
export type SeedanceResolution = "480p" | "720p" | "1080p";

export enum VideoModel {
  Wan = 'wan',
  Kling = 'kling',
  /** @deprecated Old Bytedance Seedance v1 (NSFW path) — API-blocked 2026-04-29. Removed from picker 2026-04-29. Enum kept for historical DB rows. */
  Bytedance = 'bytedance',
  KlingMotionControl = 'kling-motion-control',
  /** Bytedance Seedance 2.0 reference-to-video, added 2026-04-29 (Creator+ tier). FAL endpoint: fal-ai/bytedance/seedance-2.0/reference-to-video */
  Seedance2Ref = 'seedance-2-ref',
  /**
   * Kling 3.0 Video — same model Higgsfield exposes as "Kling 3.0" in
   * their UI. Adds end-frame interpolation, multi-shot continuity, 4K
   * output (when mode='4k'), and longer max duration (15s) over the
   * Kling 2.6 generation. Replicate: kwaivgi/kling-v3-video. There is
   * no FAL equivalent — this is a Replicate-only model in the picker.
   */
  KlingV3 = 'kling-v3',
  /** @deprecated Removed from picker 2026-04-29. Enum kept for historical DB rows. */
  Veo = 'veo',
}
