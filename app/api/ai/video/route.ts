import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { VideoGenerationInput } from "@/types/video";
import { VideoModel } from "@/types/types";
import { submitFalJob, uploadImageUrlToFalStorage } from "@/lib/fal-client";


enum Duration {
  Five = "5",
  Ten = "10",
}

export async function POST(req: NextRequest) {
  try {
    const data: VideoGenerationInput = await req.json();

    const webhookUrl = getWebhookUrl("/api/webhook/video");

    const duration = String(data.duration) === Duration.Ten ? Duration.Ten : Duration.Five;

    let falHostedImageUrl: string;
    try {
      falHostedImageUrl = await uploadImageUrlToFalStorage(data.image_url);
    } catch (err) {
      console.error("[VIDEO] Failed to upload reference image to Fal storage:", data.image_url, err);
      return NextResponse.json(
        { error: "Failed to process reference image. Please re-upload and try again." },
        { status: 400 }
      );
    }
    
    // 🔹 Kling handler
    if (data.model === VideoModel.Kling) {

      const input = {
        prompt: data.prompt,
        image_url: falHostedImageUrl,
        aspect_ratio: data.aspect_ratio,
        duration: duration,
        negative_prompt: data.negative_prompt,
        cfg_scale: data.cfg_scale,
        generate_audio: data.generate_audio !== false,
      }

      console.log("[VIDEO][Kling 2.6] submitting", {
        endpoint: "fal-ai/kling-video/v2.6/pro/image-to-video",
        aspect_ratio: input.aspect_ratio,
        duration: input.duration,
        generate_audio: input.generate_audio,
      });

      const { request_id } = await submitFalJob("fal-ai/kling-video/v2.6/pro/image-to-video", {
        input,
        webhookUrl,
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }

    // 🔹 Kling Motion Control handler
    // Note: This model requires image_url, video_url, and character_orientation
    // It does NOT support aspect_ratio, duration, negative_prompt, or cfg_scale
    // Duration is determined by character_orientation: "image" (max 10s) or "video" (max 30s)
    if (data.model === VideoModel.KlingMotionControl) {
      if (!data.video_url) {
        return NextResponse.json({ 
          error: "Reference video is required for Kling Motion Control" 
        }, { status: 400 });
      }

      let falHostedVideoUrl: string;
      try {
        falHostedVideoUrl = await uploadImageUrlToFalStorage(data.video_url);
      } catch (err) {
        console.error("[VIDEO] Failed to upload reference video to Fal storage:", data.video_url, err);
        return NextResponse.json(
          { error: "Failed to process reference video. Please re-upload and try again." },
          { status: 400 }
        );
      }

      const input = {
        image_url: falHostedImageUrl,
        video_url: falHostedVideoUrl,
        character_orientation: data.character_orientation || "image", // "image" (max 10s) or "video" (max 30s)
        prompt: data.prompt || undefined,
        keep_original_sound: data.keep_original_sound !== false,
      }

      const { request_id } = await submitFalJob("fal-ai/kling-video/v2.6/standard/motion-control", {
        input,
        webhookUrl,
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }

    // 🔹 Veo handler
    // Note: This model does NOT support enable_safety_checker, negative_prompt, or cfg_scale
    // Duration format is "4s", "6s", or "8s" (not "5" or "10")
    if (data.model === VideoModel.Veo) {
      // Convert duration to Veo format: "4s", "6s", or "8s"
      const veoDuration = duration === Duration.Ten ? "8s" : "4s";
      
      // Convert aspect_ratio format if needed (Veo uses "auto", "16:9", "9:16")
      let veoAspectRatio = "auto";
      if (data.aspect_ratio === "16:9") {
        veoAspectRatio = "16:9";
      } else if (data.aspect_ratio === "9:16") {
        veoAspectRatio = "9:16";
      }

      const input = {
        prompt: data.prompt,
        image_url: falHostedImageUrl,
        aspect_ratio: veoAspectRatio,
        duration: veoDuration,
        // Note: negative_prompt and cfg_scale are NOT supported by Veo 3.1
      }

      const { request_id } = await submitFalJob("fal-ai/veo3.1/fast/image-to-video", {
        input,
        webhookUrl,
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }

    // 🔹 WAN handler
    if (data.model === VideoModel.Wan) {
      const input = {
        prompt: data.prompt,
        image_url: falHostedImageUrl,
        aspect_ratio: data.aspect_ratio,
        enable_safety_checker: false,
      };

      const { request_id } = await submitFalJob("fal-ai/wan-pro/image-to-video", {
        input,
        webhookUrl
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }

    // 🔹 Bytedance handler
    if (data.model === VideoModel.Bytedance) {
      const input = {
        prompt: data.prompt,
        image_url: falHostedImageUrl,
        aspect_ratio: data.aspect_ratio,
        duration: duration,
        enable_safety_checker: false,
      };

      const { request_id } = await submitFalJob("fal-ai/bytedance/seedance/v1/pro/fast/image-to-video", {
        input,
        webhookUrl
      });

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }

    // ❌ Invalid model
    return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json({ error: "Video generation failed" }, { status: 500 });
  }
}
