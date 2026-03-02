// app/api/webhook/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { ExtendedImage, FalImageOutput, Image } from "@/types/image";
import { getWebhookData } from "@/lib/webhook/get-webhook-data";
import { verifyWebhook } from "@/lib/webhook/verify-webhook";
import { updateJobStatus } from "@/lib/webhook/update-job-status";
import { normalizeApiErrors } from "@/lib/normalize-fal-error";
import { flaggedErrors } from "@/lib/flagged-errors";

export async function POST(req: NextRequest) {
  try {
    console.log(`[IMAGE WEBHOOK] Received webhook request`);
    
    // Parse and extract raw webhook data & headers
    const { rawBody, json, requestId, userId, timestamp, signature } = await getWebhookData(req);

    console.log(`[IMAGE WEBHOOK] Processing requestId: ${requestId}, userId: ${userId}`);

    // Verify signature
    const valid = await verifyWebhook(requestId, userId, timestamp, signature, rawBody);
    if (!valid) {
      console.error(`[IMAGE WEBHOOK] Invalid signature for requestId: ${requestId}`);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Map raw JSON to typed union
    const data: FalImageOutput = json;
    console.log(`[IMAGE WEBHOOK] Status: ${data.status} for requestId: ${requestId}`);

    // Fetch job record
    const jobRecord = await prismadb.generatedImage.findUnique({
      where: { id: requestId },
      select: { userId: true, variant: true, status: true },
    });

    if (!jobRecord?.userId) {
      console.warn(`[IMAGE WEBHOOK] Missing userId for requestId: ${requestId}`);
      return new NextResponse("Missing userId", { status: 400 });
    }

    // If job is already completed, return immediately
    if (jobRecord.status === "completed") {
      console.log(`[IMAGE WEBHOOK] Job ${requestId} already completed, skipping`);
      return new NextResponse("Image saved", { status: 200 });
    }

    // Handle successful generation
    if (data.status === "OK") {
      const imagesArray: ExtendedImage[] = data.payload.images?.map((img: Image, index: number) => ({
        url: img.url,
        height: img.height,
        width: img.width,
        content_type: img.content_type || "unknown",
        is_nsfw: data.payload.has_nsfw_concepts?.[index] || false,
      })) || [];

      //* Check if ALL images are NSFW
      const allNsfw = imagesArray.length > 0 && imagesArray.every(img => img.is_nsfw);

      if (allNsfw) {
        const nsfwErrors = flaggedErrors(
          imagesArray,
          "nsfw_image",
          (img, index) => `Image at index ${index} (${img.url}) was blocked due to NSFW content.`
        );

        // Mark as failed
        await updateJobStatus({
          model: prismadb.generatedImage,
          requestId,
          userId: jobRecord.userId,
          urlValue: undefined,
          toolType: ToolType.IMAGE_GENERATOR,
          reason: nsfwErrors
        });

        return new NextResponse("Marked as failed (all images NSFW)", { status: 200 });
      }

      //* At least one non-NSFW image, proceed normally
      const imageUrl = imagesArray.find(img => !img.is_nsfw)?.url || imagesArray[0]?.url;

      const status = await updateJobStatus({
        model: prismadb.generatedImage,
        requestId,
        userId: jobRecord.userId,
        urlValue: imageUrl,
        imagesArray: imagesArray.length > 0 ? imagesArray : undefined,
        toolType: ToolType.IMAGE_GENERATOR,
      });

      console.log(`[IMAGE WEBHOOK] Updated job ${requestId} to status: ${status}`);
      return new NextResponse(
        status === "completed" ? "Image saved" : "Marked as failed",
        { status: 200 }
      );
    }

    // Handle error case
    if (data.status === "ERROR") {
      console.warn(`[IMAGE WEBHOOK] Generation failed [requestId: ${requestId}]`, {
        error: data.error,
      });

      const normalizedErrors = normalizeApiErrors(data.payload.detail);

      await updateJobStatus({
        model: prismadb.generatedImage,
        requestId,
        userId: jobRecord.userId,
        urlValue: undefined,
        toolType: ToolType.IMAGE_GENERATOR,
        reason: normalizedErrors,
      });

      console.log(`[IMAGE WEBHOOK] Marked job ${requestId} as failed`);
      return new NextResponse("Marked as failed", { status: 200 });
    }

    // Fallback - should never happen with proper typing, but handle gracefully
    const unknownStatus = (data as any).status;
    console.warn(`[IMAGE WEBHOOK] Unhandled format [requestId: ${requestId}], status: ${unknownStatus}`);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error(`[IMAGE WEBHOOK] Handler error for requestId: ${req.headers.get('x-fal-webhook-request-id') || 'unknown'}:`, err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
