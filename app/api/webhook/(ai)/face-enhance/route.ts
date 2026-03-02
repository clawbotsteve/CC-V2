// app/api/webhook/face-enhance/route.ts

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { FalFaceEnhanceOutput } from "@/types/enhance";
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

    const data: FalFaceEnhanceOutput = json;

    // Fetch job record
    const jobRecord = await prismadb.faceEnhance.findUnique({
      where: { id: requestId },
      select: { userId: true, status: true },
    });

    if (!jobRecord?.userId)
      return new NextResponse("Missing userId", { status: 400 });

    // Early exit if already completed
    if (jobRecord.status === "completed") {
      console.log(`[FACE ENHANCE WEBHOOK] Job ${requestId} already completed`);
      return new NextResponse("Face enhance saved", { status: 200 });
    }

    // Success: enhanced image exists
    if (data.status === "OK" && data.payload?.images?.[0]?.url) {
      const imageUrl = data.payload.images[0].url;

      const status = await updateJobStatus({
        model: prismadb.faceEnhance,
        requestId,
        userId: jobRecord.userId,
        urlValue: imageUrl,
        toolType: ToolType.FACE_ENHANCE,
      });

      return new NextResponse(
        status === "completed" ? "Face enhance saved" : "Marked as failed",
        { status: 200 }
      );
    }

    // Error or missing image
    if (data.status === "ERROR" || !data.payload?.images?.length) {
      console.warn(`[FACE ENHANCE WEBHOOK] Generation failed for requestId: ${requestId}`, {
        error: data.error,
      });

      await updateJobStatus({
        model: prismadb.faceEnhance,
        requestId,
        userId: jobRecord.userId,
        urlValue: undefined,
        toolType: ToolType.FACE_ENHANCE,
      });

      return new NextResponse("Marked as failed", { status: 200 });
    }

    console.warn(`[FACE ENHANCE WEBHOOK] Unhandled webhook format for requestId: ${requestId}`);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("[FACE ENHANCE WEBHOOK] Handler error:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
