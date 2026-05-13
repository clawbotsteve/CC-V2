// Replicate image-completion webhook handler.
//
// Mirrors the role of /api/webhook/image (the FAL handler) but for
// Replicate's payload shape. When IMAGE_PROVIDER=replicate is active,
// image-generation submissions point Replicate at this URL instead.
//
// Replicate's webhook body shape (https://replicate.com/docs/webhooks):
//
//   {
//     "id": "abc123",                    // prediction id (== our request_id)
//     "status": "succeeded" | "failed" | "canceled" | "starting" | "processing",
//     "output": <model-specific, see below>,
//     "error": null | string,
//     "input": {...},
//     "logs": "...",
//     "metrics": { "predict_time": 12.34 },
//     ...
//   }
//
// The `output` shape varies per model — sometimes a string URL,
// sometimes string[], sometimes an object with .url. Use
// extractReplicateImageUrls() to normalize.
//
// Webhook signature verification (Replicate's HMAC-SHA256 scheme,
// keyed by REPLICATE_WEBHOOK_SECRET) is the standard hardening step.
// PR A ships WITHOUT verification so we can validate the end-to-end
// path on staging first; PR B (when we flip prod traffic) adds it.
// Tracked in the todo list — DO NOT ship to prod without enabling.

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { extractReplicateImageUrls } from "@/lib/replicate-client";
import { updateJobStatus } from "@/lib/webhook/update-job-status";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const requestId: string | undefined = json?.id;
    const status: string | undefined = json?.status;
    const output: unknown = json?.output;
    const error: unknown = json?.error;

    console.log(
      `[REPLICATE WEBHOOK] received id=${requestId} status=${status}${error ? ` error=${String(error).slice(0, 200)}` : ""}`,
    );

    if (!requestId) {
      return new NextResponse("Missing prediction id", { status: 400 });
    }

    // Locate the matching GeneratedImage row. The submission code
    // saved the prediction id as the row's primary key (same pattern
    // as the FAL path) so this lookup mirrors the FAL webhook.
    const jobRecord = await prismadb.generatedImage.findUnique({
      where: { id: requestId },
      select: { userId: true, variant: true, creditVariant: true, status: true },
    });

    if (!jobRecord?.userId) {
      console.warn(`[REPLICATE WEBHOOK] no GeneratedImage row for ${requestId}`);
      // Return 200 so Replicate doesn't retry forever on rows we
      // don't recognize (training jobs, other tools' rows, etc. —
      // each has its own webhook).
      return new NextResponse("No matching job", { status: 200 });
    }

    if (jobRecord.status === "completed") {
      console.log(`[REPLICATE WEBHOOK] already completed: ${requestId}`);
      return new NextResponse("Already completed", { status: 200 });
    }

    if (status === "succeeded") {
      const urls = extractReplicateImageUrls(output);
      const imageUrl = urls[0];

      if (!imageUrl) {
        console.error(`[REPLICATE WEBHOOK] no URL in output for ${requestId}`, output);
        await prismadb.generatedImage.update({
          where: { id: requestId },
          data: { status: "failed", reason: { message: "No image URL in output" } as any },
        });
        return new NextResponse("No URL in output", { status: 200 });
      }

      await updateJobStatus({
        model: prismadb.generatedImage,
        requestId,
        userId: jobRecord.userId,
        urlValue: imageUrl,
        // Surface the rest of the URLs as the `images` JSON column
        // (mirror of FAL's payload.images[]) so the UI can show
        // batched outputs when num_images > 1.
        imagesArray:
          urls.length > 0
            ? urls.map((url) => ({
                url,
                width: 0,
                height: 0,
                content_type: "image/png",
                is_nsfw: false,
              }))
            : undefined,
        toolType: ToolType.IMAGE_GENERATOR,
        variant: jobRecord.creditVariant ?? jobRecord.variant ?? undefined,
      });

      return new NextResponse("OK", { status: 200 });
    }

    if (status === "failed" || status === "canceled") {
      await prismadb.generatedImage.update({
        where: { id: requestId },
        data: {
          status: "failed",
          reason: { message: String(error || status) } as any,
        },
      });
      return new NextResponse("Marked failed", { status: 200 });
    }

    // starting / processing / other — no-op, wait for the next webhook
    // (Replicate fires multiple per prediction unless we filter).
    return new NextResponse("Acknowledged", { status: 200 });
  } catch (err: any) {
    console.error("[REPLICATE WEBHOOK] handler error:", err?.message || err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
