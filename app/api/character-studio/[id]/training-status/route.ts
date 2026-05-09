import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { chargeUserForTool } from "@/lib/charge-user";
import { ToolType } from "@prisma/client";

fal.config({ credentials: process.env.FAL_API_KEY! });

/**
 * POST /api/character-studio/[id]/training-status
 *
 * Manually re-poll Tavira AI's training queue for this character's
 * LoRA job. Used by the wizard's "Check status now" button when the
 * webhook didn't fire (or got dropped) and the row has been sitting
 * in `queued` longer than the user's patience.
 *
 * Three terminal outcomes:
 *   - "completed"  loraUrl + configUrl saved, status=completed,
 *                  AVATAR_TRAINING credits deducted (same path the
 *                  webhook would've taken).
 *   - "failed"     status=failed, no credit charge (mirrors the
 *                  webhook's failure handling — failed trainings are
 *                  free).
 *   - "in_progress" status untouched, returned to the caller so the
 *                   UI can keep showing the "training in progress"
 *                   state.
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

    // The character.id IS the FAL training request_id (set by /finalize
    // when it swapped the draft row for one keyed off the FAL response).
    // Same endpoint /api/ai/train uses for FLUX_1 trainings.
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
        data: { status: "failed" },
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
