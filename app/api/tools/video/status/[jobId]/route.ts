import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getFalJobResult, getFalJobStatus } from "@/lib/fal-client";
import { getReplicateJobStatus, extractReplicateImageUrls } from "@/lib/replicate-client";
import { getWaveSpeedResult } from "@/lib/wavespeed-client";
import { chargeExplicitCredits, chargeUserForTool } from "@/lib/charge-user";
import { talkingCredits } from "@/lib/ad-studio/talking-pricing";
import { persistUrl } from "@/lib/webhook/update-job-status";
import { ToolType } from "@prisma/client";

/**
 * Tiny wrapper so the three reconciliation branches below don't
 * each repeat the persistUrl try/catch. Always returns a string —
 * the original URL if S3 isn't configured or mirroring fails.
 */
async function durableVideoUrl(rawUrl: string, jobId: string): Promise<string> {
  try {
    return await persistUrl(rawUrl, "GeneratedVideo", jobId);
  } catch (err) {
    console.warn("[VIDEO STATUS] S3 mirror failed; keeping provider URL:", err);
    return rawUrl;
  }
}

function getFalEndpointFromModel(model?: string): string | null {
  if (!model) return null;
  if (model === "kling") return "fal-ai/kling-video/v2.6/pro/image-to-video";
  if (model === "kling-motion-control") return "fal-ai/kling-video/v2.6/standard/motion-control";
  if (model === "seedance-2-ref") return "fal-ai/bytedance/seedance-2.0/reference-to-video";
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
        userId: true,
        duration: true,
        creditVariant: true,
      },
    });

    if (!videoJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fallback provider sync when webhook/local callback didn't persist output yet.
    if ((videoJob.status === "queued" || videoJob.status === "processing") && !videoJob.videoUrl) {
      // WaveSpeed talking-ad jobs have NO webhook into us — the only
      // way they resolve is by polling WaveSpeed here.
      if (videoJob.model === "wavespeed-seedance2") {
        const w = await getWaveSpeedResult(jobId);
        if (w.status === "completed" && w.videoUrl) {
          // Charge on completion. Two callers share this WaveSpeed
          // branch — they need different charge models:
          //
          //   • Ad Studio talking-ad: variant looks like
          //     "wavespeed_talk_720p_5s" → computed pricing
          //     (per-second × resolution) via talkingCredits().
          //   • Regular video gen (Seedance via WaveSpeed,
          //     2026-05-29): variant looks like "seedance_v2_ref_5s"
          //     → standard discrete-tier credit cost via
          //     chargeUserForTool() with the variant lookup.
          //
          // Branch on the variant prefix. Both are double-charge
          // guarded by their respective charge helpers.
          try {
            const variant = videoJob.creditVariant || "";
            if (variant.startsWith("wavespeed_talk_")) {
              const res = variant.replace("wavespeed_talk_", "");
              const amount = talkingCredits(videoJob.duration, res);
              await chargeExplicitCredits({
                userId: videoJob.userId,
                amount,
                usageTable: "GeneratedVideo",
                usageId: jobId,
              });
            } else {
              await chargeUserForTool({
                userId: videoJob.userId,
                tool: ToolType.VIDEO_GENERATOR,
                variant,
                usageId: jobId,
                usageTable: "GeneratedVideo",
              });
            }
          } catch (chargeErr) {
            console.error(
              "[VIDEO STATUS] wavespeed video charge failed (delivering anyway):",
              chargeErr,
            );
          }
          // Mirror to S3 before persisting — WaveSpeed video URLs
          // may also expire; defense in depth.
          const durable = await durableVideoUrl(w.videoUrl, jobId);
          await prismadb.generatedVideo.update({
            where: { id: jobId },
            data: { status: "completed", videoUrl: durable },
          });
          return NextResponse.json(
            { status: "completed", videoUrl: durable },
            { status: 200 },
          );
        }
        if (w.status === "failed") {
          await prismadb.generatedVideo.update({
            where: { id: jobId },
            data: { status: "failed" },
          });
          return NextResponse.json(
            { status: "failed", videoUrl: null },
            { status: 200 },
          );
        }
        return NextResponse.json(
          { status: "processing", videoUrl: null },
          { status: 200 },
        );
      }

      // Replicate webhook-miss reconciliation FIRST (production
      // provider; previously only FAL was reconciled here → a
      // dropped Replicate video webhook span the UI forever).
      try {
        const p: any = await getReplicateJobStatus(jobId);
        const st = String(p?.status || "").toLowerCase();
        if (st === "succeeded") {
          const v = extractReplicateImageUrls(p?.output)[0];
          if (v) {
            // Mirror replicate.delivery URL to S3 before saving —
            // it expires in ~24h otherwise.
            const durable = await durableVideoUrl(v, jobId);
            await prismadb.generatedVideo.update({
              where: { id: jobId },
              data: { status: "completed", videoUrl: durable },
            });
            return NextResponse.json(
              { status: "completed", videoUrl: durable },
              { status: 200 },
            );
          }
        } else if (st === "failed" || st === "canceled") {
          await prismadb.generatedVideo.update({
            where: { id: jobId },
            data: { status: "failed" },
          });
          return NextResponse.json(
            { status: "failed", videoUrl: null },
            { status: 200 },
          );
        }
      } catch {
        /* not a Replicate job / transient — fall through to FAL */
      }

      const endpoint = getFalEndpointFromModel(videoJob.model);
      if (endpoint) {
        try {
          const falStatus: any = await getFalJobStatus(endpoint, jobId);
          const status = String(falStatus?.status || "").toUpperCase();

          if (status === "COMPLETED") {
            const falResult: any = await getFalJobResult(endpoint, jobId);
            const syncedVideoUrl = extractVideoUrl(falResult);

            if (syncedVideoUrl) {
              const durable = await durableVideoUrl(syncedVideoUrl, jobId);
              await prismadb.generatedVideo.update({
                where: { id: jobId },
                data: { status: "completed", videoUrl: durable },
              });

              return NextResponse.json({ status: "completed", videoUrl: durable }, { status: 200 });
            }
          }

          // Some providers return result URL before status normalization; try direct result as fallback.
          try {
            const falResultAny: any = await getFalJobResult(endpoint, jobId);
            const directVideoUrl = extractVideoUrl(falResultAny);
            if (directVideoUrl) {
              const durable = await durableVideoUrl(directVideoUrl, jobId);
              await prismadb.generatedVideo.update({
                where: { id: jobId },
                data: { status: "completed", videoUrl: durable },
              });
              return NextResponse.json({ status: "completed", videoUrl: durable }, { status: 200 });
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
