import { ErrorPayload, OutputFormat, SafetyTolerance } from "./types";

interface Image {
  url: string;
}

interface Enhance {
  images: Image[];
  seed: number;
}

export type FalFaceEnhanceOutput =
  | {
    status: "OK";
    error: null;
    gateway_request_id: string;
    payload: Enhance;
    request_id: string;
  }
  | {
    status: "ERROR";
    error: string;
    gateway_request_id: string;
    payload: ErrorPayload;
    request_id: string;
  };


export type FaceEnhanceInput = {
  aspect_ratio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
  guidance_scale: number;
  image: string;
  num_inference_step: number;
  output_format: OutputFormat;
  safety_level: SafetyTolerance;
  referenceImage?: File;
};

export type FaceEnhanceForm = FaceEnhanceInput;

export const defaultFaceEnhanceForm: FaceEnhanceForm = {
  aspect_ratio: "16:9",
  guidance_scale: 3.5,
  image: "",
  num_inference_step: 28,
  output_format: OutputFormat.Png,
  safety_level: SafetyTolerance.Level6,
  referenceImage: undefined,
};
