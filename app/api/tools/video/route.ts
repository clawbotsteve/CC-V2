// app/api/generate-video/route.ts

import { checkAvailableCredit } from "@/lib/check-available-credit";
import prismadb from "@/lib/prismadb";
import { absoluteUrl } from "@/lib/utils";
import { VideoGenerationInput, VideoModel, getVideoCreditVariant } from "@/types/video";
import { auth } from "@clerk/nextjs/server";
import { ToolType } from "@prisma/client";
import axios from "axios";
import { NextResponse } from "next/server";
import { getFalJobResult } from "@/lib/fal-client";
import { canUseVideoModel, requiredPlanForVideoModel, resolveAccessTier } from "@/lib/plan-access";

function getFalEndpointFromModel(model?: string): string | null {
  if (!model) return null;
  if (model === "kling") return "fal-ai/kling-video/v2.6/pro/image-to-video";
  if (model === "kling-motion-control") return "fal-ai/kling-video/v2.6/standard/motion-control";
  if (model === "veo") return "fal-ai/veo3.1/fast/image-to-video";
  if (model === "bytedance") return "fal-ai/bytedance/seedance/v1/pro/fast/image-to-video";
  return null;
}

function extractVideoUrl(payload: any): string | null {
  return (
    payload?.videoUrl ||
    payload?.video_url ||
    payload?.video?.url ||
    payload?.video?.video_url ||
    payload?.payload?.video?.url ||
    payload?.payload?.video_url ||
    payload?.payload?.videos?.[0]?.url ||
    payload?.data?.video?.url ||
    payload?.data?.video_url ||
    payload?.output?.video?.url ||
    payload?.output?.video_url ||
    payload?.result?.video?.url ||
    payload?.result?.video_url ||
    null
  );
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const videos = await prismadb.generatedVideo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Opportunistic provider sync for stuck queued/processing rows.
    for (const video of videos) {
      if ((video.status === "queued" || video.status === "processing") && !video.videoUrl) {
        const endpoint = getFalEndpointFromModel(video.model);
        if (!endpoint) continue;

        try {
          const result: any = await getFalJobResult(endpoint, video.id);
          const syncedVideoUrl = extractVideoUrl(result);
          if (syncedVideoUrl) {
            video.status = "completed" as any;
            video.videoUrl = syncedVideoUrl;
            try {
              await prismadb.generatedVideo.update({
                where: { id: video.id },
                data: { status: "completed", videoUrl: syncedVideoUrl },
              });
            } catch {}
          }
        } catch {}
      }
    }

    return NextResponse.json({ videos });
  } catch (err) {
    console.error("[VIDEO TOOLS] Failed to fetch videos:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.warn("[VIDEO TOOLS] POST - Unauthorized request: missing userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: VideoGenerationInput = await req.json();

    // Platform safety enforcement: always enable safety checker, override user input
    data.enable_safety_checker = true;

    const subscription = await prismadb.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const access = resolveAccessTier(subscription?.plan?.tier);

    if (!canUseVideoModel(access, data.model)) {
      return NextResponse.json(
        { error: `This video model requires the ${requiredPlanForVideoModel(data.model)} plan.` },
        { status: 403 }
      );
    }

    const { canUse, creditCost } = await checkAvailableCredit({
      userId: userId,
      tool: ToolType.VIDEO_GENERATOR,
      variant: getVideoCreditVariant(data),
    });

    if (!canUse) {
      return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
    }

    if (!data.model) {
      console.warn("[VIDEO TOOLS] POST - Missing required field: model");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!data.prompt || !data.prompt.trim() || !data.image_url) {
      return NextResponse.json(
        { error: "Missing prompt or Image" },
        { status: 400 }
      );
    }

    // Validate video_url for Kling Motion Control
    if (data.model === VideoModel.KlingMotionControl && !data.video_url) {
      return NextResponse.json(
        { error: "Reference video is required for Kling Motion Control. Please upload a video to control the motion." },
        { status: 400 }
      );
    }

    console.log("[VIDEO TOOLS] POST - Submitting video generation request");

    const falRes = await axios.post(
      absoluteUrl("/api/ai/video"),
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (falRes.status < 200 || falRes.status >= 300 || !falRes.data?.requestId) {
      console.error("[VIDEO TOOLS] POST - Video generation failed to start:", falRes.data);
      return NextResponse.json({ error: "Video generation failed to start" }, { status: 500 });
    }

    const { requestId } = falRes.data;
    const nsfwFlag = !data.enable_safety_checker;

    await prismadb.generatedVideo.create({
      data: {
        id: requestId,
        userId,
        model: data.model,
        prompt: data.prompt,
        negativePrompt: data.model === "kling" ? data.negative_prompt : "",
        adherence: data.model === "wan" ? data.cfg_scale! : 0,
        aspectRatio: data.aspect_ratio!,
        duration: data.model === "wan" ? 5 : data.duration!,
        contentType: nsfwFlag ? "nsfw" : "sfw",
        nsfwFlag,
        variant: data.variant,
        videoUrl: null,
        status: "queued",
        creditUsed: 0,
      },
    });

    console.log(`[VIDEO TOOLS] POST - Job queued successfully with requestId: ${requestId}`);

    return NextResponse.json({ jobId: requestId }, { status: 200 });
  } catch (err) {
    console.error("[VIDEO TOOLS] POST - Internal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
