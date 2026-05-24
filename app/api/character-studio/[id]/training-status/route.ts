import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { chargeUserForTool } from "@/lib/charge-user";
import { ToolType } from "@prisma/client";
import { getImageProvider } from "@/lib/image-provider";
import { getReplicateJobStatus } from "@/lib/replicate-client";
import { mirrorUrlToS3, isS3Configured } from "@/lib/storage/s3";
import { extractWeightsUrl } from "@/lib/replicate-training";

fal.config({ credentials: process.env.FAL_API_KEY! });

/**
 * POST /api/character-studio/[id]/training-status
 *
 * Manually re-poll the active training provider for this character's
 * LoRA job. Used by the wizard's "Check status now" button AND its
 * background 30-second polling tick — this is the safety net for
 * dropped webhooks.
 *
 * Provider-aware (2026-05-23): routes by IMAGE_PROVIDER env var.
 * Previously FAL-only, which meant users on Replicate (the new
 * provider after FAL went offline) had no working safety net — a
 * missed Replicate webhook left them spinning forever.
 *
 * Three terminal outcomes (same shape across providers so the
 * frontend doesn't have to care):
 *   - "completed"  loraUrl saved, status=completed, characterStudio
 *                  Step="complete", AVATAR_TRAINING credits deducted
 *                  (same path the webhook would've taken).
 *   - "failed"     status=failed + characterStudioStep="complete" so
 *                  the wizard exits the loading state and shows the
 *                  failure UI. No credit charge (failed trainings
 *                  are free, mirroring webhook handling).
 *   - "in_progress" no DB write, returned to the caller so the UI
 *                   keeps showing "training in progress."
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const character = await prismadb.influencer.findFirst({
      where: { id, userId, isActive: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    if (character.status === "completed") {
      // Already done. Return what we have.
      return NextResponse.json({
        outcome: "completed",
        loraUrl: (character as any).loraUrl,
        configUrl: (character as any).configUrl,
      });
    }

    const provider = getImageProvider();

    // ────────────────────────────────────────────────────────────
    // REPLICATE BRANCH
    // ────────────────────────────────────────────────────────────
    if (provider === "replicate") {
      let prediction: any;
      try {
        prediction = await getReplicateJobStatus(id);
      } catch (err: any) {
        console.error(
          "[CHARACTER-STUDIO_TRAINING_STATUS][replicate] status failed",
          id,
          err?.message,
        );
        return NextResponse.json(
          { error: "Couldn't reach Tavira AI. Try again in a moment." },
          { status: 502 },
        );
      }

      const status = String(prediction?.status || "").toLowerCase();

      if (status === "succeeded") {
        const replicateWeightsUrl = extractWeightsUrl(prediction?.output);
        if (!replicateWeightsUrl) {
          // Output didn't carry weights — treat as a failed training
          // so the wizard exits the spinner rather than retry forever.
          await prismadb.influencer.update({
            where: { id },
            data: {
              status: "failed",
              characterStudioStep: "complete",
            } as any,
          });
          return NextResponse.json(
            { error: "Training completed but no LoRA file was returned. Contact support." },
            { status: 502 },
          );
        }

        // Mirror to our S3 if available — Replicate's URLs expire in
        // ~24h, so saving the raw replicate.delivery URL is a hidden
        // landmine. Same logic as the webhook handler so both paths
        // produce identical durable URLs.
        let finalLoraUrl = replicateWeightsUrl;
        if (isS3Configured()) {
          try {
            finalLoraUrl = await mirrorUrlToS3(
              replicateWeightsUrl,
              `loras/${id}`,
              "lora.safetensors",
            );
          } catch (err: any) {
            console.error(
              "[CHARACTER-STUDIO_TRAINING_STATUS][replicate] S3 mirror failed; keeping Replicate URL (24h expiry):",
              err?.message || err,
            );
          }
        } else {
          console.warn(
            "[CHARACTER-STUDIO_TRAINING_STATUS][replicate] S3 not configured — LoRA URL will expire in ~24h.",
          );
        }

        await prismadb.influencer.update({
          where: { id },
          data: {
            status: "completed",
            loraUrl: finalLoraUrl,
            characterStudioStep: "complete",
            // Replicate trainer doesn't return a separate configUrl
            // (FAL did) — leave it unset; downstream inference works.
          } as any,
        });

        try {
          await chargeUserForTool({
            userId: character.userId,
            tool: ToolType.AVATAR_TRAINING,
            usageId: id,
            usageTable: "AvatarTraining",
          });
        } catch (chargeErr) {
          console.warn(
            "[CHARACTER-STUDIO_TRAINING_STATUS][replicate] charge skipped",
            id,
            chargeErr,
          );
        }

        return NextResponse.json({ outcome: "completed", loraUrl: finalLoraUrl });
      }

      if (status === "failed" || status === "canceled") {
        await prismadb.influencer.update({
          where: { id },
          data: {
            status: "failed",
            characterStudioStep: "complete",
          } as any,
        });
        return NextResponse.json({ outcome: "failed" });
      }

      // starting / processing → keep waiting.
      return NextResponse.json({ outcome: "in_progress", queueStatus: status });
    }

    // ────────────────────────────────────────────────────────────
    // FAL BRANCH (default — current production path)
    // ────────────────────────────────────────────────────────────
    // The character.id IS the FAL training request_id (set by /finalize
    // when it swapped the draft row for one keyed off the FAL response).
    const TRAIN_ENDPOINT = "fal-ai/flux-lora-fast-training";

    let status: any;
    try {
      status = await fal.queue.status(TRAIN_ENDPOINT, { requestId: id });
    } catch (err: any) {
      console.error("[CHARACTER-STUDIO_TRAINING_STATUS] queue.status failed", id, err?.message);
      return NextResponse.json(
        { error: "Couldn't reach Tavira AI. Try again in a moment." },
        { status: 502 }
      );
    }

    const queueStatus = (status?.status || "").toUpperCase();

    if (queueStatus === "COMPLETED") {
      // Job finished — webhook may have missed. Pull the result and
      // patch the row ourselves. Mirrors the webhook handler exactly
      // so the user ends up in the same final state either way.
      let result: any;
      try {
        result = await fal.queue.result(TRAIN_ENDPOINT, { requestId: id });
      } catch (err: any) {
        console.error("[CHARACTER-STUDIO_TRAINING_STATUS] queue.result failed", id, err?.message);
        return NextResponse.json(
          { error: "Training reported done but Tavira AI didn't return a payload. Try again." },
          { status: 502 }
        );
      }

      const payload = result?.data ?? result;
      const loraUrl = payload?.diffusers_lora_file?.url ?? null;
      const configUrl = payload?.config_file?.url ?? null;

      if (!loraUrl) {
        return NextResponse.json(
          { error: "Training completed but no LoRA file was returned. Contact support." },
          { status: 502 }
        );
      }

      await prismadb.influencer.update({
        where: { id },
        data: {
          status: "completed",
          loraUrl,
          configUrl,
          characterStudioStep: "complete",
        } as any,
      });

      // Deduct AVATAR_TRAINING credits the same way the webhook would
      // have. chargeUserForTool is idempotent on the usage row (it
      // updates `creditUsed` rather than creating a new charge), so
      // double-firing this won't double-charge — but we're reaching
      // this path because the webhook DIDN'T fire, so it's the only
      // charge.
      try {
        await chargeUserForTool({
          userId: character.userId,
          tool: ToolType.AVATAR_TRAINING,
          usageId: id,
          usageTable: "AvatarTraining",
        });
      } catch (chargeErr) {
        // Don't block the user from getting their LoRA over a credit
        // accounting hiccup — just log and continue. We'll reconcile
        // out-of-band if needed.
        console.warn("[CHARACTER-STUDIO_TRAINING_STATUS] charge skipped", id, chargeErr);
      }

      return NextResponse.json({ outcome: "completed", loraUrl, configUrl });
    }

    if (queueStatus === "ERROR" || queueStatus === "FAILED" || queueStatus === "CANCELLED") {
      await prismadb.influencer.update({
        where: { id },
        data: {
          status: "failed",
          characterStudioStep: "complete",
        } as any,
      });
      return NextResponse.json({ outcome: "failed" });
    }

    // Still IN_QUEUE / IN_PROGRESS. Tell the caller to keep waiting.
    return NextResponse.json({ outcome: "in_progress", queueStatus });
  } catch (err: any) {
    console.error("[CHARACTER-STUDIO_TRAINING_STATUS]", err?.message || err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
