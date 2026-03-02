import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { submitFalJob, uploadImageUrlToFalStorage } from "@/lib/fal-client";
import { InfluencerModel } from "@/types/influencer";


interface FinetuneTrainInput {
  images_data_url: string;
  create_masks?: boolean;
  steps?: number;
  is_style?: boolean;
  is_input_format_already_preprocessed?: boolean;
  data_archive_format?: string;
  trigger_word?: string;
  model: InfluencerModel;
  learning_rate?: number;
  default_caption?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: FinetuneTrainInput = await req.json();

    if (!body.images_data_url || typeof body.images_data_url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid images_data_url" },
        { status: 400 }
      );
    }

    const webhookUrl = getWebhookUrl("/api/webhook/train");

    const {
      images_data_url,
      create_masks = true,
      steps = 2000,
      is_style = false,
      is_input_format_already_preprocessed = false,
      trigger_word = undefined,
      model,
      learning_rate = undefined,
      default_caption = undefined,
    } = body;

    const falTrainingDataUrl = await uploadImageUrlToFalStorage(images_data_url);


    if (!model) {
      return NextResponse.json(
        { error: "Missing or invalid model" },
        { status: 400 }
      );
    }

    if (model === InfluencerModel.FLUX_1) {

      const { request_id } = await submitFalJob("fal-ai/flux-lora-fast-training", {
        input: {
          images_data_url: falTrainingDataUrl,
          create_masks,
          steps,
          is_style,
          is_input_format_already_preprocessed,
          trigger_word,
        },
        webhookUrl,
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }
    else if (model === InfluencerModel.FLUX_2) {
      const flux2Input: any = {
        image_data_url: falTrainingDataUrl,
        steps: steps,
      };

      // Only include optional parameters if they are defined
      if (learning_rate !== undefined) {
        flux2Input.learning_rate = learning_rate;
      }
      if (default_caption !== undefined && default_caption !== "") {
        flux2Input.default_caption = default_caption;
      }
console.log("Flux 2 input",flux2Input);
      const { request_id } = await submitFalJob("fal-ai/flux-2-trainer", {
        input: flux2Input,
        webhookUrl,
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }
  } catch (error) {
    console.error("Finetune training error:", error);
    return NextResponse.json(
      { error: "Failed to submit finetune training job" },
      { status: 500 }
    );
  }
}
