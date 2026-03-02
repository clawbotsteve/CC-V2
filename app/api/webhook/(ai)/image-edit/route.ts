// app/api/webhook/image-edit/route.ts

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { getWebhookData } from "@/lib/webhook/get-webhook-data";
import { verifyWebhook } from "@/lib/webhook/verify-webhook";
import { updateJobStatus } from "@/lib/webhook/update-job-status";
import { FalImageEditorOutput } from "@/types/editor";

export async function POST(req: NextRequest) {
  try {
    // Extract raw body, headers, and parsed JSON
    const { rawBody, json, requestId, userId, timestamp, signature } = await getWebhookData(req);

    // Verify signature
    const valid = await verifyWebhook(requestId, userId, timestamp, signature, rawBody);
    if (!valid) return new NextResponse("Unauthorized", { status: 401 });

    // Map raw JSON to typed output
    const data: FalImageEditorOutput = json;

    // Fetch job record
    const jobRecord = await prismadb.imageEdit.findUnique({
      where: { id: requestId },
      select: { userId: true, status: true },
    });

    if (!jobRecord?.userId) return new NextResponse("Missing userId", { status: 400 });

    // If already completed, return early
    if (jobRecord.status === "completed") {
      console.info(`[IMAGE EDIT WEBHOOK] Job ${requestId} already completed`);
      return new NextResponse("Image saved", { status: 200 });
    }

    // Handle success
    if (data.status === "OK") {
      const imageUrl = data.payload.images[0]?.url;

      const status = await updateJobStatus({
        model: prismadb.imageEdit,
        requestId,
        userId: jobRecord.userId,
        urlValue: imageUrl,
        toolType: ToolType.IMAGE_EDITOR,
      });

      return new NextResponse(
        status === "completed" ? "Image saved" : "Marked as failed",
        { status: 200 }
      );
    }

    // Handle error
    if (data.status === "ERROR") {
      console.warn(`[IMAGE EDIT WEBHOOK] Generation failed [requestId: ${requestId}]`, {
        error: data.error,
      });

      await updateJobStatus({
        model: prismadb.imageEdit,
        requestId,
        userId: jobRecord.userId,
        urlValue: undefined,
        toolType: ToolType.IMAGE_EDITOR,
      });

      return new NextResponse("Marked as failed", { status: 200 });
    }

    // Fallback
    console.warn(`[IMAGE EDIT WEBHOOK] Unhandled format [requestId: ${requestId}]`);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("[IMAGE EDIT WEBHOOK] Handler error:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
