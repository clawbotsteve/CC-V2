// app/api/webhook/video/route.ts

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { FalVideoGenerationOutput } from "@/types/video";
import { getWebhookData } from "@/lib/webhook/get-webhook-data";
import { verifyWebhook } from "@/lib/webhook/verify-webhook";
import { updateJobStatus } from "@/lib/webhook/update-job-status";
import { NormalizedError } from "@/lib/normalize-fal-error";

export async function POST(req: NextRequest) {
  try {
    const { rawBody, json, requestId, userId, timestamp, signature } = await getWebhookData(req);

    const valid = await verifyWebhook(requestId, userId, timestamp, signature, rawBody);
    if (!valid) return new NextResponse("Unauthorized", { status: 401 });

    const data: FalVideoGenerationOutput = json;

    const jobRecord = await prismadb.generatedVideo.findUnique({
      where: { id: requestId },
      select: { userId: true, variant: true, status: true },
    });

    if (!jobRecord?.userId) return new NextResponse("Missing userId", { status: 400 });

    if (jobRecord.status === "completed") {
      console.log(`[VIDEO WEBHOOK] Job ${requestId} already completed`);
      return new NextResponse("Video saved", { status: 200 });
    }

    // SUCCESS
    if (data.status === "OK") {
      const status = await updateJobStatus({
        model: prismadb.generatedVideo,
        requestId,
        userId: jobRecord.userId,
        urlValue: data.payload.video.url,
        toolType: ToolType.VIDEO_GENERATOR,
      });

      return new NextResponse(
        status === "completed" ? "Video saved" : "Marked as failed",
        { status: 200 }
      );
    }

    // ERROR or missing video
    if (data.status === "ERROR") {
      console.warn(`[VIDEO WEBHOOK] Generation failed for requestId: ${requestId}`, {
        error: data.error,
      });

      const errors: NormalizedError = {
        code: data.payload.detail[0].type,
        reason: data.payload.detail[0].msg
      }

      await updateJobStatus({
        model: prismadb.generatedVideo,
        requestId,
        userId: jobRecord.userId,
        urlValue: undefined,
        toolType: ToolType.VIDEO_GENERATOR,
        reason: [errors]
      });

      return new NextResponse("Marked as failed", { status: 200 });
    }

    console.warn(`[VIDEO WEBHOOK] Unhandled format for requestId: ${requestId}`);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("[VIDEO WEBHOOK] Handler error:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
