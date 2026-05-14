import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
// Provider-routed. Picks FAL or Replicate based on IMAGE_PROVIDER.
import { submitImageJob as submitFalJob, uploadImageUrlToProvider as uploadImageUrlToFalStorage } from "@/lib/image-provider";
import { ImageGenerationModel } from "@/types/image";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { VARIATION_PROMPTS } from "@/lib/character-studio/variation-prompts";

interface RetryBody {
  /** 0-based index into characterStudioVariations[] of the tile to retry. */
  index: number;
}

/**
 * POST /api/character-studio/[id]/variations/retry
 * Re-runs ONE variation tile rather than the whole batch. Wired up to
 * the per-tile ↻ button on the wizard. Useful when the wildcard
 * doesn't come back cleanly and the user doesn't want to burn 5 more
 * credits re-rolling the variations that were fine.
 *
 * Replaces the jobId at the given index with a new one (the previous
 * GeneratedImage row stays in the DB but is no longer referenced).
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
    const body: RetryBody = await req.json();
    const idx = Number(body.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= VARIATION_PROMPTS.length) {
      return NextResponse.json({ error: "Invalid variation index." }, { status: 400 });
    }

    const character = await prismadb.influencer.findFirst({
      where: { id, userId, isActive: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    if (!character.characterStudioRef) {
      return NextResponse.json(
        { error: "Generate or upload a base reference first." },
        { status: 400 }
      );
    }

    const variantKey = "nano_banana_2_1k";
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.IMAGE_GENERATOR,
      variant: variantKey,
    });
    const userLimit = await prismadb.userApiLimit.findUnique({
      where: { userId },
      select: { availableCredit: true },
    });
    if ((userLimit?.availableCredit ?? 0) < creditCheck.creditCost) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${creditCheck.creditCost}` },
        { status: 403 }
      );
    }

    const variation = VARIATION_PROMPTS[idx];
    const moderation = await moderateAndLog({
      userId,
      endpoint: "character-studio.variation-retry",
      prompt: variation.prompt,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    let falHostedRef: string;
    try {
      falHostedRef = await uploadImageUrlToFalStorage(character.characterStudioRef);
    } catch (err) {
      console.error("[CHARACTER-STUDIO_VARIATION_RETRY] FAL upload failed", err);
      return NextResponse.json(
        { error: "Failed to prepare reference for retry." },
        { status: 502 }
      );
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image");
    const resp = await submitFalJob(ImageGenerationModel.NanoBanana2, {
      input: {
        prompt: variation.prompt,
        num_images: 1,
        output_format: "png",
        output_resolution: "1K",
        resolution: "1K",
        aspect_ratio: "9:16",
        aspectRatio: "9:16",
        image_urls: [falHostedRef],
      },
      webhookUrl,
    });

    if (!resp?.request_id) {
      return NextResponse.json({ error: "FAL did not return a request id." }, { status: 502 });
    }

    await prismadb.generatedImage.create({
      data: {
        id: resp.request_id,
        userId,
        imageUrl: "",
        prompt: variation.prompt,
        variant: "sfw",
        creditVariant: variantKey,
        contentType: "sfw",
        nsfwFlag: false,
        status: "queued",
      },
    });

    // Splice the new jobId in at the given index. The old jobId is
    // dropped from the array; its GeneratedImage row stays in the DB
    // for audit but is no longer referenced by the character.
    const next = [...(character.characterStudioVariations ?? [])];
    next[idx] = resp.request_id;
    const updated = await prismadb.influencer.update({
      where: { id },
      data: { characterStudioVariations: next },
    });

    return NextResponse.json({ character: updated, jobId: resp.request_id, index: idx });
  } catch (err: any) {
    console.error("[CHARACTER-STUDIO_VARIATION_RETRY]", err?.message || err);
    return NextResponse.json(
      { error: "Retry failed." },
      { status: 500 }
    );
  }
}
