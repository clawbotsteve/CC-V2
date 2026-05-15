import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { VideoGenerationInput, clampSeedanceDuration, SEEDANCE_DEFAULT_RESOLUTION } from "@/types/video";
import { SeedanceResolution, VideoModel } from "@/types/types";
// Provider-routed. submitImageJob + uploadImageUrlToProvider pick FAL
// or Replicate based on IMAGE_PROVIDER. See lib/image-provider.ts for
// the routing + per-model input translation logic.
import { submitImageJob as submitFalJob, uploadImageUrlToProvider as uploadImageUrlToFalStorage } from "@/lib/image-provider";
import { moderateAndLog } from "@/lib/content-moderation";


enum Duration {
  Five = "5",
  Ten = "10",
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const data: VideoGenerationInput = await req.json();

    if (data.prompt) {
      const moderation = await moderateAndLog({
        userId: userId ?? null,
        endpoint: "ai.video",
        prompt: data.prompt,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
    }

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

    // 🔹 Kling 3.0 handler (Replicate-only, no FAL fallback).
    // Same model Higgsfield exposes as "Kling 3.0". Adds end-frame,
    // multi-shot, and up to 4K output over the Kling 2.6 path above.
    if (data.model === VideoModel.KlingV3) {
      const klingV3Input: any = {
        prompt: data.prompt,
        image_url: falHostedImageUrl,
        aspect_ratio: data.aspect_ratio,
        // Allow durations up to 15s for Kling 3.0; UI clamps but
        // we coerce defensively here too.
        duration: Math.min(15, Math.max(1, Number(data.duration) || 5)),
        generate_audio: data.generate_audio !== false,
        // mode: "standard" | "pro" | "4k". Default "pro" (1080p)
        // matches the existing Kling 2.6 pricing tier so users
        // upgrading don't get a billing surprise. Picker can override.
        mode: (data as any).kling_v3_mode || "pro",
      };
      if (data.negative_prompt) klingV3Input.negative_prompt = data.negative_prompt;

      const { request_id } = await submitFalJob(
        "fal-ai/kling-video/v3/image-to-video",
        { input: klingV3Input, webhookUrl }
      );

      return NextResponse.json({ success: true, requestId: request_id });
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
        enable_safety_checker: true,
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

    // 🔹 Bytedance Seedance 2.0 reference-to-video (Creator+, added 2026-04-29)
    // FAL endpoint: fal-ai/bytedance/seedance-2.0/reference-to-video
    //
    // Updated 2026-05-04 (#33): replaced fixed 5/10s + locked 720p with full
    // 4-15s range + 480p/720p/1080p picker. FAL accepts any int 4-15 as
    // a stringified `duration`. We clamp server-side because the client
    // slider could be tampered with — defensive auth + cost control.
    if (data.model === VideoModel.Seedance2Ref) {
      const seedanceDur = clampSeedanceDuration(data.duration);
      const seedanceRes: SeedanceResolution =
        data.seedance_resolution === "480p" || data.seedance_resolution === "1080p"
          ? data.seedance_resolution
          : SEEDANCE_DEFAULT_RESOLUTION;

      const input: Record<string, unknown> = {
        prompt: data.prompt,
        image_urls: [falHostedImageUrl],
        duration: String(seedanceDur),
        resolution: seedanceRes,
        ...(data.aspect_ratio ? { aspect_ratio: data.aspect_ratio } : {}),
        ...(data.generate_audio !== undefined ? { generate_audio: data.generate_audio } : {}),
      };

      const { request_id } = await submitFalJob(
        "fal-ai/bytedance/seedance-2.0/reference-to-video",
        { input, webhookUrl }
      );

      return NextResponse.json({
        success: true,
        requestId: request_id,
      });
    }

    // 🔹 Bytedance Seedance v1 (DEPRECATED 2026-04-29 — was the NSFW path, now blocked)
    if (data.model === VideoModel.Bytedance) {
      return NextResponse.json(
        { error: "This model is no longer available. Please use Kling or Seedance 2.0." },
        { status: 410 }
      );
    }

    // ❌ Invalid model
    return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json({ error: "Video generation failed" }, { status: 500 });
  }
}
