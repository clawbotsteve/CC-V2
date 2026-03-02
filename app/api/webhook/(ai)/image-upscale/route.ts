// app/api/webhook/upscale/route.ts

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { FalImageUpscaleOutput } from "@/types/upscale";
import { getWebhookData } from "@/lib/webhook/get-webhook-data";
import { verifyWebhook } from "@/lib/webhook/verify-webhook";
import { updateJobStatus } from "@/lib/webhook/update-job-status";

export async function POST(req: NextRequest) {
  try {
    // Extract raw body, JSON, headers
    const { rawBody, json, requestId, userId, timestamp, signature } = await getWebhookData(req);

    // Verify webhook signature
    const valid = await verifyWebhook(requestId, userId, timestamp, signature, rawBody);
    if (!valid) return new NextResponse("Unauthorized", { status: 401 });

    const data: FalImageUpscaleOutput = json;

    // Fetch job record
    const jobRecord = await prismadb.upscaled.findUnique({
      where: { id: requestId },
      select: { userId: true, status: true },
    });

    if (!jobRecord?.userId)
      return new NextResponse("Missing userId", { status: 400 });

    // Early exit if already completed
    if (jobRecord.status === "completed") {
      console.log(`[UPSCALE WEBHOOK] Job ${requestId} already completed`);
      return new NextResponse("Image saved", { status: 200 });
    }

    // Success: upscaled image URL exists
    if (data.status === "OK" && data.payload?.image?.url) {
      const status = await updateJobStatus({
        model: prismadb.upscaled,
        requestId,
        userId: jobRecord.userId,
        urlValue: data.payload.image.url,
        toolType: ToolType.IMAGE_UPSCALER,
      });

      return new NextResponse(
        status === "completed" ? "Image saved" : "Marked as failed",
        { status: 200 }
      );
    }

    // Error or missing image
    if (data.status === "ERROR" || !data.payload?.image?.url) {
      console.warn(`[UPSCALE WEBHOOK] Generation failed for requestId: ${requestId}`, {
        error: data.error,
      });

      await updateJobStatus({
        model: prismadb.upscaled,
        requestId,
        userId: jobRecord.userId,
        urlValue: undefined,
        toolType: ToolType.IMAGE_UPSCALER,
      });

      return new NextResponse("Marked as failed", { status: 200 });
    }

    console.warn(`[UPSCALE WEBHOOK] Unhandled webhook format for requestId: ${requestId}`);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("[UPSCALE WEBHOOK] Handler error:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
