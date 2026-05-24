// Replicate LoRA training completion webhook.
//
// When IMAGE_PROVIDER=replicate is active, /api/ai/train submits to
// Replicate's ostris/flux-dev-lora-trainer instead of FAL. This
// handler is the parallel of /api/webhook/(ai)/train but for
// Replicate's payload shape.
//
// Critical: Replicate's LoRA outputs live on replicate.delivery and
// auto-expire after ~24 hours. We CANNOT save the Replicate URL
// directly on the Influencer row — the LoRA would become unusable
// the next day. Instead we:
//
//   1. Webhook fires with the training completion payload
//   2. We extract the .safetensors weights URL from the output
//   3. Download it server-side
//   4. Re-upload to our own S3 bucket (mirrorUrlToS3)
//   5. Save the PERSISTENT S3 URL on Influencer.loraUrl
//   6. Charge credits (same path the FAL webhook uses)
//
// If S3 isn't configured (UPLOAD_MODE != "s3" or creds missing) we
// fall back to saving Replicate's URL and log a warning — the LoRA
// will work for ~24h, giving the operator time to wire up storage
// without losing the training.

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { chargeUserForTool } from "@/lib/charge-user";
import { ToolType } from "@prisma/client";
import { mirrorUrlToS3, isS3Configured } from "@/lib/storage/s3";
import { extractWeightsUrl } from "@/lib/replicate-training";

interface ReplicateTrainingPayload {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output:
    | {
        // ostris/flux-dev-lora-trainer's output shape includes both
        // a destination version and a direct weights URL.
        weights?: string;
        version?: string;
      }
    | string
    | null;
  error: string | null;
  input: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as ReplicateTrainingPayload;
    const requestId = json?.id;
    const status = json?.status;
    const output = json?.output;
    const error = json?.error;

    console.log(
      `[REPLICATE TRAIN WEBHOOK] id=${requestId} status=${status}${error ? ` error=${String(error).slice(0, 200)}` : ""}`,
    );

    if (!requestId) {
      return new NextResponse("Missing training id", { status: 400 });
    }

    // Look up the matching Influencer row. /finalize swapped the row
    // to be keyed by the training request_id, same pattern as the
    // FAL webhook.
    const influencer = await prismadb.influencer.findFirst({
      where: { id: requestId },
    });
    if (!influencer) {
      console.warn(`[REPLICATE TRAIN WEBHOOK] no Influencer for ${requestId}`);
      // 200 so Replicate doesn't retry forever on rows we don't own
      // (other tools' trainings would also POST here in future).
      return new NextResponse("No matching Influencer", { status: 200 });
    }
    if (influencer.status === "completed") {
      console.log(`[REPLICATE TRAIN WEBHOOK] already completed: ${requestId}`);
      return new NextResponse("Already completed", { status: 200 });
    }

    // FAILED / CANCELED branch — same handling as the FAL path.
    // characterStudioStep flipped to "complete" too so the wizard
    // exits its training-loading state and shows the failure UI
    // instead of spinning forever.
    if (status === "failed" || status === "canceled") {
      await prismadb.influencer.update({
        where: { id: requestId },
        data: {
          status: "failed",
          updatedAt: new Date(),
          characterStudioStep: "complete",
        } as any,
      });
      console.warn(`[REPLICATE TRAIN WEBHOOK] training failed ${requestId}: ${error}`);
      return new NextResponse("Marked failed", { status: 200 });
    }

    // SUCCEEDED branch — extract weights URL + persist.
    if (status === "succeeded") {
      const replicateWeightsUrl = extractWeightsUrl(output);
      if (!replicateWeightsUrl) {
        console.error(
          `[REPLICATE TRAIN WEBHOOK] no weights URL in output for ${requestId}`,
          output,
        );
        await prismadb.influencer.update({
          where: { id: requestId },
          data: { status: "failed", updatedAt: new Date() },
        });
        return new NextResponse("No weights URL", { status: 200 });
      }

      // Mirror to our own S3 so the LoRA URL is permanent. If S3 isn't
      // wired up yet we save the Replicate URL as a temporary fallback
      // and emit a loud warning — gives the operator a window to fix
      // storage without losing the training entirely.
      let finalLoraUrl = replicateWeightsUrl;
      if (isS3Configured()) {
        try {
          finalLoraUrl = await mirrorUrlToS3(
            replicateWeightsUrl,
            `loras/${requestId}`,
            "lora.safetensors",
          );
          console.log(`[REPLICATE TRAIN WEBHOOK] mirrored to S3: ${finalLoraUrl}`);
        } catch (err: any) {
          console.error(
            `[REPLICATE TRAIN WEBHOOK] S3 mirror FAILED for ${requestId}; keeping Replicate URL (will expire in 24h):`,
            err?.message || err,
          );
          // Fall through with the Replicate URL — at least the LoRA
          // works for a day while we debug S3.
        }
      } else {
        console.warn(
          "[REPLICATE TRAIN WEBHOOK] S3 not configured (UPLOAD_MODE != s3). " +
            "Saving Replicate URL — will expire in ~24h. Wire up S3 to fix.",
        );
      }

      await prismadb.influencer.update({
        where: { id: requestId },
        data: {
          status: "completed",
          loraUrl: finalLoraUrl,
          // Replicate doesn't return a separate config_file like FAL
          // does — flux-dev-lora-trainer's output is just the
          // weights. Leave configUrl unset; downstream code handles
          // null configUrl gracefully (existing FLUX_1 path doesn't
          // require it for inference).
          updatedAt: new Date(),
          // 2026-05-23: wizard checks this field — not just status —
          // to exit the polling state. Bug parallel to the FAL
          // webhook fix in /api/webhook/(ai)/train.
          characterStudioStep: "complete",
        } as any,
      });

      // Charge credits using the same path the FAL webhook used.
      try {
        await chargeUserForTool({
          userId: influencer.userId,
          tool: ToolType.AVATAR_TRAINING,
          usageId: requestId,
          usageTable: "AvatarTraining",
        });
      } catch (err) {
        // Same forgiving handling as the manual recovery endpoint:
        // don't fail the whole webhook on a credit-accounting issue.
        console.warn(
          `[REPLICATE TRAIN WEBHOOK] charge skipped for ${requestId}`,
          err,
        );
      }

      return new NextResponse("Training saved", { status: 200 });
    }

    // starting / processing — acknowledge and wait for the completion
    // webhook (we filter to "completed" events anyway, so this branch
    // is rare).
    return new NextResponse("Acknowledged", { status: 200 });
  } catch (err: any) {
    console.error("[REPLICATE TRAIN WEBHOOK] handler error:", err?.message || err);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// extractWeightsUrl moved to lib/replicate-training.ts so the
// manual-recovery endpoint (/api/character-studio/[id]/training-status)
// can import it too — Next.js App Router forbids non-route exports
// from route files.
