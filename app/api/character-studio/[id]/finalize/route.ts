import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import JSZip from "jszip";
import { absoluteUrl } from "@/lib/utils";
import { CURRENT_TRAINING_CONSENT_VERSION } from "@/constants/constants";
import { InfluencerModel } from "@/types/influencer";
import { canUseCharacterStudio, resolveAccessTier } from "@/lib/plan-access";
import { PLAN_CREATOR, PLAN_STUDIO } from "@/constants";

interface FinalizeBody {
  /**
   * Per-job likeness consent. Matches the legacy /api/influencers
   * contract — required for every new training, even when the
   * "character" was AI-generated. We keep the gate because:
   *   1. Users CAN upload a real photo at Step 2 (the upload mode).
   *   2. The downstream LoRA model can be used to generate further
   *      images, and we want one consistent audit trail.
   */
  consentAccepted: boolean;
}

/**
 * Build the training-set ZIP server-side from the base reference +
 * variations. The browser was previously doing this via JSZip + a
 * client fetch of each FAL URL, but FAL's CDN doesn't always permit
 * cross-origin browser fetches — so we'd pull empty blobs and the
 * resulting ZIP would be invalid. Server-side fetch avoids the CORS
 * dance entirely.
 *
 * The ZIP is uploaded to FAL storage (same pattern /api/ai/train uses
 * for `images_data_url`) so /api/ai/train gets a publicly fetchable
 * URL its workers can pull.
 */
async function buildAndHostTrainingZip(urls: string[]): Promise<string> {
  const zip = new JSZip();
  let added = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[CHARACTER-STUDIO_FINALIZE] skip image ${i} (${res.status})`, url);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") || "image/png";
      const ext = ct.includes("png")
        ? "png"
        : ct.includes("webp")
          ? "webp"
          : ct.includes("jpeg") || ct.includes("jpg")
            ? "jpg"
            : "png";
      zip.file(`image-${i}.${ext}`, buf);
      added++;
    } catch (err) {
      console.warn(`[CHARACTER-STUDIO_FINALIZE] fetch failed for image ${i}`, url, err);
    }
  }

  if (added < 4) {
    throw new Error(
      `Only ${added} of ${urls.length} training images could be fetched. Re-roll the variations and try again.`
    );
  }

  const zipBytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // Upload the ZIP directly to FAL storage using the FAL client. This
  // skips our /api/upload round-trip and means /api/ai/train just gets
  // a public URL it can hand straight to the training endpoint.
  const { fal } = await import("@fal-ai/client");
  return fal.storage.upload(new Blob([zipBytes], { type: "application/zip" }));
}

/**
 * POST /api/character-studio/[id]/finalize
 * Step 4 of the wizard. Submits the LoRA training job to FAL via the
 * existing /api/ai/train endpoint.
 *
 * Implementation note: the legacy Influencer flow assumes
 * `Influencer.id === FAL training request_id` (the train webhook looks
 * up by id). Our Character Studio draft was created at Step 1 with a
 * fresh cuid. To reuse the legacy webhook without changes, we delete
 * the draft row and recreate it under the FAL request_id, copying all
 * the Character Studio metadata over.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: FinalizeBody = await req.json();

    if (!body.consentAccepted) {
      return NextResponse.json(
        { error: "Likeness consent is required before training." },
        { status: 400 }
      );
    }

    const character = await prismadb.influencer.findFirst({
      where: { id, userId, isActive: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    if (!character.characterStudioRef) {
      return NextResponse.json(
        { error: "Generate or upload a base reference before training." },
        { status: 400 }
      );
    }
    if ((character.characterStudioVariations?.length ?? 0) < 1) {
      return NextResponse.json(
        { error: "Generate variations before training." },
        { status: 400 }
      );
    }

    // Resolve the variation jobIds → actual image URLs from the
    // GeneratedImage rows the webhook populated. The Influencer's
    // characterStudioVariations stores ONLY the request_ids.
    const variationJobs = await prismadb.generatedImage.findMany({
      where: { id: { in: character.characterStudioVariations } },
      select: { id: true, status: true, imageUrl: true },
    });
    const variationUrls = variationJobs
      .filter((j) => j.status === "completed" && j.imageUrl)
      .map((j) => j.imageUrl);

    // Build & host the training ZIP server-side. Avoids the browser
    // CORS dance against fal.media that was failing at upload time.
    let trainingFileUrl: string;
    try {
      trainingFileUrl = await buildAndHostTrainingZip([
        character.characterStudioRef,
        ...variationUrls,
      ]);
    } catch (zipErr: any) {
      console.error("[CHARACTER-STUDIO_FINALIZE] zip build failed", zipErr);
      return NextResponse.json(
        { error: zipErr?.message || "Failed to build training ZIP." },
        { status: 502 }
      );
    }

    const subscription = await prismadb.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const access = resolveAccessTier(subscription?.plan?.tier);
    if (!canUseCharacterStudio(access)) {
      return NextResponse.json(
        { error: "Character Studio requires the Creator plan." },
        { status: 403 }
      );
    }

    // Submit the LoRA training job. We mirror the existing
    // /api/influencers POST handler's call to /api/ai/train (steps,
    // model, learning rate). Forwarding the cookie keeps the inner
    // call's auth happy.
    const planTier = subscription?.plan?.tier;
    const isCreatorPlus = planTier === PLAN_CREATOR || planTier === PLAN_STUDIO;
    const trainSteps = isCreatorPlus ? 2000 : 1000;

    const trainRes = await axios.post(
      absoluteUrl("/api/ai/train"),
      {
        images_data_url: trainingFileUrl,
        is_style: false,
        model: InfluencerModel.FLUX_1,
        trigger_word: character.triggerWord || character.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        steps: trainSteps,
      },
      {
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") ?? "",
        },
      }
    );

    const requestId: string | undefined = trainRes.data?.requestId;
    if (!requestId) {
      return NextResponse.json(
        { error: "Training failed to start (no requestId)." },
        { status: 502 }
      );
    }

    // Atomically swap the draft row for the real one. The legacy train
    // webhook does findUnique({ where: { id: request_id } }) on
    // Influencer, so we MUST recreate the row under the new id.
    const draftId = character.id;
    const swapped = await prismadb.$transaction(async (tx) => {
      await tx.influencer.delete({ where: { id: draftId } });
      return tx.influencer.create({
        data: {
          id: requestId,
          userId,
          name: character.name,
          description: character.description,
          mode: character.mode,
          step: character.step ?? trainSteps.toString(),
          gender: character.gender,
          avatarImageUrl: character.avatarImageUrl,
          triggerWord: character.triggerWord,
          trainingFile: trainingFileUrl,
          status: "queued",
          isPublic: character.isPublic,
          contentType: character.contentType,
          consentAccepted: true,
          consentAcceptedAt: new Date(),
          consentTermsVersion: CURRENT_TRAINING_CONSENT_VERSION,

          // Carry over the Character Studio metadata. The promptPack
          // jobIds inside characterStudioPromptPack still resolve via
          // GeneratedImage.id — those rows are independent of the
          // Influencer row's id.
          niche: character.niche,
          characterStudioCharType: character.characterStudioCharType,
          characterStudioBrand: character.characterStudioBrand,
          characterStudioProduct: character.characterStudioProduct,
          characterStudioRef: character.characterStudioRef,
          characterStudioVariations: character.characterStudioVariations,
          characterStudioPromptPack: character.characterStudioPromptPack ?? undefined,
          characterStudioStep: "training",
        },
      });
    });

    return NextResponse.json({
      character: swapped,
      jobId: requestId,
      // Surface the new id back to the client — the wizard was tracking
      // the draft id and needs to replace its reference.
      newCharacterId: requestId,
      previousCharacterId: draftId,
    });
  } catch (err: any) {
    console.error("[CHARACTER-STUDIO_FINALIZE]", err?.response?.data || err?.message || err);
    return NextResponse.json(
      { error: "Failed to start training. Please try again." },
      { status: 500 }
    );
  }
}
