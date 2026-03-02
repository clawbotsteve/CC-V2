import { Acceleration, ErrorPayload, OutputFormat } from "./types";

interface Image {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
  width: number;
  height: number;
}

interface ImageEditor {
  images: Image[];
  timings: Timings;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

interface Timings {
  queue_time_ms: number;
  processing_time_ms: number;
  total_time_ms: number;
}

export type FalImageEditorOutput =
  | {
    status: "OK";
    error: null;
    gateway_request_id: string;
    payload: ImageEditor;
    request_id: string;
  }
  | {
    status: "ERROR";
    error: string;
    gateway_request_id: string;
    payload: ErrorPayload;
    request_id: string;
  };

export type ImageEditorInput = {
  image_url: string;
  strength: number;
  num_inference_steps: number;
  prompt: string;
  seed?: number;
  guidance_scale?: number;
  sync_mode?: boolean;
  num_images?: number;
  enable_safety_checker?: boolean;
  output_format?: OutputFormat;
  acceleration?: Acceleration;
  referenceImage?: File;
};

export type ImageEditorForm = ImageEditorInput;

export const defaultImageEditorForm: ImageEditorForm = {
  image_url: "",
  strength: 0.95,
  num_inference_steps: 40,
  prompt: "",
  seed: Math.floor(Math.random() * 9_000_000) + 1_000_000,
  guidance_scale: 3.5,
  sync_mode: false,
  num_images: 1,
  enable_safety_checker: false,
  output_format: OutputFormat.Png,
  acceleration: Acceleration.None,
  referenceImage: undefined,
};
