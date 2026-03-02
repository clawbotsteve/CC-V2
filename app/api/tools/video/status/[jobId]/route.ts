import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getFalJobResult, getFalJobStatus } from "@/lib/fal-client";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await auth();
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
    }

    const videoJob = await prismadb.generatedVideo.findFirst({
      where: {
        id: jobId,
        userId: user.userId,
      },
      select: {
        status: true,
        videoUrl: true,
        model: true,
      },
    });

    if (!videoJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fallback provider sync when webhook/local callback didn't persist output yet.
    if ((videoJob.status === "queued" || videoJob.status === "processing") && !videoJob.videoUrl) {
      const endpoint = getFalEndpointFromModel(videoJob.model);
      if (endpoint) {
        try {
          const falStatus: any = await getFalJobStatus(endpoint, jobId);
          const status = String(falStatus?.status || "").toUpperCase();

          if (status === "COMPLETED") {
            const falResult: any = await getFalJobResult(endpoint, jobId);
            const syncedVideoUrl = extractVideoUrl(falResult);

            if (syncedVideoUrl) {
              await prismadb.generatedVideo.update({
                where: { id: jobId },
                data: { status: "completed", videoUrl: syncedVideoUrl },
              });

              return NextResponse.json({ status: "completed", videoUrl: syncedVideoUrl }, { status: 200 });
            }
          }

          // Some providers return result URL before status normalization; try direct result as fallback.
          try {
            const falResultAny: any = await getFalJobResult(endpoint, jobId);
            const directVideoUrl = extractVideoUrl(falResultAny);
            if (directVideoUrl) {
              await prismadb.generatedVideo.update({
                where: { id: jobId },
                data: { status: "completed", videoUrl: directVideoUrl },
              });
              return NextResponse.json({ status: "completed", videoUrl: directVideoUrl }, { status: 200 });
            }
          } catch {}

          if (status === "FAILED") {
            await prismadb.generatedVideo.update({
              where: { id: jobId },
              data: { status: "failed" },
            });
            return NextResponse.json({ status: "failed", videoUrl: null }, { status: 200 });
          }
        } catch (err) {
          console.warn("[VIDEO STATUS] Provider sync fallback failed:", err);
        }
      }
    }

    return NextResponse.json(
      { status: videoJob.status, videoUrl: videoJob.videoUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch video job status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
