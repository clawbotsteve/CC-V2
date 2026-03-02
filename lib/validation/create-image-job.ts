import {
  ImageGenerationInput,
  ImageGenerationModel,
} from "@/types/image";
import { ImageSize, SafetyTolerance } from "@/types/types";

export function createImageJob(input: ImageGenerationInput): ImageGenerationInput {
  if (!input.prompt?.trim()) {
    throw new Error("Prompt is required");
  }

  const job: ImageGenerationInput = {
    ...input,
    seed: input.seed ?? Math.floor(Math.random() * 9_000_000) + 1_000_000,
    output_format: input.output_format ?? "png",
    sync_mode: input.sync_mode ?? false,
  };

  if (input.lora_id !== "none" || (input.loras && input.loras.length > 0)) {
    // Lora defaults
    job.guidance_scale = input.guidance_scale ?? 3;
    job.image_size = input.image_size ?? ImageSize.Landscape16_9;
    job.num_inference_steps = input.num_inference_steps ?? 28;
    job.loras = input.loras ?? [];
    job.enable_safety_checker = input.enable_safety_checker ?? false;

  } else if (input.model === ImageGenerationModel.NanoBannaPro || input.model === ImageGenerationModel.NanoBanana2) {
    // Nano Banana defaults: preserve explicit user selection and keep aspect + size in sync.
    const fromSize =
      input.image_size === "square" || input.image_size === "square_hd"
        ? "1:1"
        : input.image_size === "portrait_16_9"
          ? "9:16"
          : input.image_size === "landscape_16_9"
            ? "16:9"
            : input.image_size === "portrait_4_3"
              ? "3:4"
              : input.image_size === "landscape_4_3"
                ? "4:3"
                : undefined;

    const normalizedAspect = (fromSize || input.aspect_ratio || "1:1") as any;
    job.aspect_ratio = normalizedAspect;
    job.output_resolution = input.output_resolution ?? "1k";
    job.enable_safety_checker = input.enable_safety_checker ?? false;
    job.safety_tolerance = input.safety_tolerance ?? SafetyTolerance.Level6;

    if (normalizedAspect === "1:1") job.image_size = "square" as any;
    else if (normalizedAspect === "9:16") job.image_size = "portrait_16_9" as any;
    else if (normalizedAspect === "16:9") job.image_size = "landscape_16_9" as any;
    else if (normalizedAspect === "3:4") job.image_size = "portrait_4_3" as any;
    else if (normalizedAspect === "4:3") job.image_size = "landscape_4_3" as any;

  } else {
    // V1 / Soul defaults
    job.image_size = input.image_size ?? ImageSize.Landscape16_9;
    job.enable_safety_checker = input.enable_safety_checker ?? false;
    job.safety_tolerance = input.safety_tolerance ?? SafetyTolerance.Level6;
  }

  return job;
}
