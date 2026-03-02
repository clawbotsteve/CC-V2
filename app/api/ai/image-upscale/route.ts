import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { ClarityUpscalerInput, UpscaleModel } from "@/types/upscale";
import { submitFalJob, uploadImageUrlToFalStorage } from "@/lib/fal-client";


export async function POST(req: NextRequest) {
  try {
    const data: ClarityUpscalerInput = await req.json();

    const webhookUrl = getWebhookUrl("/api/webhook/image-upscale");

    if (data.model === UpscaleModel.BytedanceVideo) {
      if (!data.video_url) {
        return NextResponse.json({ error: "Upload a video" }, { status: 400 });
      }

      const falVideoUrl = await uploadImageUrlToFalStorage(data.video_url);
      const input = {
        video_url: falVideoUrl,
        target_resolution: data.target_resolution ?? "1080p",
        target_fps: data.target_fps ?? "30fps",
      };

      const { request_id } = await submitFalJob(UpscaleModel.BytedanceVideo, {
        input,
        webhookUrl,
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
        message: "Video upscale job submitted.",
      });
    }

    if (!data.image_url) {
      return NextResponse.json({ error: "Upload an Image" }, { status: 400 });
    }

    const falImageUrl = await uploadImageUrlToFalStorage(data.image_url);

    if (data.model === UpscaleModel.TopazImage) {
      const { request_id } = await submitFalJob(UpscaleModel.TopazImage, {
        input: {
          image_url: falImageUrl,
          output_format: "png",
        },
        webhookUrl,
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
        message: "Topaz upscale job submitted.",
      });
    }

    const useTargetMode = Boolean(data.target_resolution);
    const input = {
      image_url: falImageUrl,
      upscale_mode: useTargetMode ? "target" : "factor",
      upscale_factor: data.upscale_factor,
      target_resolution: data.target_resolution,
      seed: data.seed,
      output_format: "png",
      noise_scale: 0.1,
    };

    const { request_id } = await submitFalJob(UpscaleModel.SeedVrImage, {
      input,
      webhookUrl,
    });

    return NextResponse.json({
      success: true,
      requestId: request_id,
      message: "Upscale job submitted. Await webhook for result.",
    });
  } catch (err) {
    console.error("Upscale submission error:", err);
    return NextResponse.json({ error: "Upscale job submission failed." }, { status: 500 });
  }
}
