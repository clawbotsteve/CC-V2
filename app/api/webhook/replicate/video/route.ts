// Replicate video-completion webhook handler.
//
// Mirrors the role of /api/webhook/(ai)/video (the FAL handler) but
// for Replicate's payload shape. Routes when IMAGE_PROVIDER=replicate
// is active.
//
// Replicate's webhook body shape — same as the image webhook
// (see /api/webhook/replicate/image/route.ts comments for details).
// The `output` field for video models is typically a STRING (the
// video URL) or an object with a .url field; image models tend to
// return an array. Use extractReplicateImageUrls() — it handles
// both shapes uniformly.
//
// Updates GeneratedVideo (not GeneratedImage) and uses
// ToolType.VIDEO_GENERATOR for the credit deduction.
//
// Signature verification will be added in a follow-up alongside the
// image webhook hardening pass (REPLICATE_WEBHOOK_SECRET).

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
      `[REPLICATE VIDEO WEBHOOK] received id=${requestId} status=${status}${error ? ` error=${String(error).slice(0, 200)}` : ""}`,
    );

    if (!requestId) {
      return new NextResponse("Missing prediction id", { status: 400 });
    }

    const jobRecord = await prismadb.generatedVideo.findUnique({
      where: { id: requestId },
      select: { userId: true, variant: true, creditVariant: true, status: true },
    });

    if (!jobRecord?.userId) {
      console.warn(`[REPLICATE VIDEO WEBHOOK] no GeneratedVideo row for ${requestId}`);
      return new NextResponse("No matching job", { status: 200 });
    }

    if (jobRecord.status === "completed") {
      console.log(`[REPLICATE VIDEO WEBHOOK] already completed: ${requestId}`);
      return new NextResponse("Already completed", { status: 200 });
    }

    if (status === "succeeded") {
      // Video models on Replicate typically return a single string URL
      // (e.g. Kling, Seedance), but extractReplicateImageUrls handles
      // arrays too just in case a multi-output model lands here.
      const urls = extractReplicateImageUrls(output);
      const videoUrl = urls[0];

      if (!videoUrl) {
        console.error(`[REPLICATE VIDEO WEBHOOK] no URL in output for ${requestId}`, output);
        await prismadb.generatedVideo.update({
          where: { id: requestId },
          data: { status: "failed", reason: { message: "No video URL in output" } as any },
        });
        return new NextResponse("No URL in output", { status: 200 });
      }

      await updateJobStatus({
        model: prismadb.generatedVideo,
        requestId,
        userId: jobRecord.userId,
        urlValue: videoUrl,
        toolType: ToolType.VIDEO_GENERATOR,
        variant: jobRecord.creditVariant ?? jobRecord.variant ?? undefined,
      });

      return new NextResponse("OK", { status: 200 });
    }

    if (status === "failed" || status === "canceled") {
      await prismadb.generatedVideo.update({
        where: { id: requestId },
        data: {
          status: "failed",
          reason: { message: String(error || status) } as any,
        },
      });
      return new NextResponse("Marked failed", { status: 200 });
    }

    // starting / processing / other — no-op, wait for next webhook
    return new NextResponse("Acknowledged", { status: 200 });
  } catch (err: any) {
    console.error("[REPLICATE VIDEO WEBHOOK] handler error:", err?.message || err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
