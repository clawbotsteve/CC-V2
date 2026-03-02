// app/api/webhook/face-swap/route.ts

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { FalFaceSwapOutput } from "@/types/swap";
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

    const data: FalFaceSwapOutput = json;

    // Fetch job record
    const jobRecord = await prismadb.faceSwap.findUnique({
      where: { id: requestId },
      select: { userId: true, status: true },
    });

    if (!jobRecord?.userId)
      return new NextResponse("Missing userId", { status: 400 });

    // Early exit if already completed
    if (jobRecord.status === "completed") {
      console.log(`[FACE SWAP WEBHOOK] Job ${requestId} already completed`);
      return new NextResponse("Face swap saved", { status: 200 });
    }

    // Success: swapped image exists
    if (data.status === "OK" && data.payload?.image?.url) {
      const imageUrl = data.payload.image.url;

      const status = await updateJobStatus({
        model: prismadb.faceSwap,
        requestId,
        userId: jobRecord.userId,
        urlValue: imageUrl,
        toolType: ToolType.IMAGE_EDITOR,
      });

      return new NextResponse(
        status === "completed" ? "Face swap saved" : "Marked as failed",
        { status: 200 }
      );
    }

    // Error or missing image
    if (data.status === "ERROR" || !data.payload?.image) {
      console.warn(`[FACE SWAP WEBHOOK] Generation failed for requestId: ${requestId}`, {
        error: data.error,
      });

      await updateJobStatus({
        model: prismadb.faceSwap,
        requestId,
        userId: jobRecord.userId,
        urlValue: undefined,
        toolType: ToolType.IMAGE_EDITOR,
      });

      return new NextResponse("Marked as failed", { status: 200 });
    }

    console.warn(`[FACE SWAP WEBHOOK] Unhandled webhook format for requestId: ${requestId}`);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("[FACE SWAP WEBHOOK] Handler error:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
