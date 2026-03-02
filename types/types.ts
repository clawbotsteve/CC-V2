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

export enum Duration {
  Five = 5,
  Ten = 10,
}

export enum VideoModel {
  Wan = 'wan',
  Kling = 'kling',
  Bytedance = 'bytedance',
  KlingMotionControl = 'kling-motion-control',
  Veo = 'veo',
}
