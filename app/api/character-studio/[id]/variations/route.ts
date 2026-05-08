import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { submitFalJob, uploadImageUrlToFalStorage } from "@/lib/fal-client";
import { ImageGenerationModel } from "@/types/image";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { VARIATION_PROMPTS } from "@/lib/character-studio/variation-prompts";

/**
 * POST /api/character-studio/[id]/variations
 * Step 3 of the wizard. Kicks off six Nano Banana 2 Edit jobs (one
 * per variation prompt) using the base reference image as input.
 *
 * Returns immediately with the six job IDs. The wizard polls the
 * GET /api/character-studio/[id] endpoint to track completion (the
 * existing /api/webhook/image flow updates each GeneratedImage row
 * once the job finishes).
 *
 * Why six (5 consistent + 1 wildcard)?
 *   The LoRA training set wants ~6-10 references of the same character
 *   to learn likeness without overfitting. Five "consistent" angles
 *   cover front / three-quarter / profile / full-body / close-up; the
 *   sixth is a deliberate wildcard with a different outfit and lighting
 *   so the LoRA doesn't lock onto the original outfit.
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
    if (!character.characterStudioRef) {
      return NextResponse.json(
        { error: "Generate or upload a base reference first." },
        { status: 400 }
      );
    }
    if (character.characterStudioStep === "variations" && (character.characterStudioVariations?.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Variations have already been generated for this character." },
        { status: 400 }
      );
    }

    // Pre-flight credit check. We need enough headroom for all six
    // jobs at once — the webhook flow deducts per-job, but if a user
    // has only 2 credits and we kick off 6 jobs we'd succeed on 2 and
    // run out, which is a worse experience than failing fast here.
    const variantKey = "nano_banana_2_1k";
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.IMAGE_GENERATOR,
      variant: variantKey,
    });
    const totalCost = creditCheck.creditCost * VARIATION_PROMPTS.length;
    const userLimit = await prismadb.userApiLimit.findUnique({
      where: { userId },
      select: { availableCredit: true },
    });
    if ((userLimit?.availableCredit ?? 0) < totalCost) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${totalCost}` },
        { status: 403 }
      );
    }

    // Upload the base reference to FAL storage once. Nano Banana 2 Edit
    // requires a publicly fetchable URL; our local /uploads paths or
    // local-dev URLs aren't reachable from FAL's workers.
    let falHostedRef: string;
    try {
      falHostedRef = await uploadImageUrlToFalStorage(character.characterStudioRef);
    } catch (err) {
      console.error("[CHARACTER-STUDIO_VARIATIONS] FAL upload failed", err);
      return NextResponse.json(
        { error: "Failed to prepare reference for variations. Try again." },
        { status: 502 }
      );
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image");
    const jobIds: string[] = [];

    // Submit each variation as its own job. We do them serially (not
    // Promise.all) so we don't slam the FAL queue with six concurrent
    // submits — the cost is ~6 × 200ms which is fine for a wizard
    // step. Each successful submit creates a corresponding
    // GeneratedImage row that the webhook will fill in.
    for (const variation of VARIATION_PROMPTS) {
      // Each variation prompt also goes through moderation. They're
      // hand-tuned and shouldn't fail, but defense in depth.
      const moderation = await moderateAndLog({
        userId,
        endpoint: "character-studio.variation",
        prompt: variation.prompt,
      });
      if (!moderation.allowed) {
        console.warn("[CHARACTER-STUDIO_VARIATIONS] variation blocked by moderation", variation.number);
        continue;
      }

      try {
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

        if (!resp?.request_id) continue;
        jobIds.push(resp.request_id);

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
      } catch (jobErr) {
        console.error("[CHARACTER-STUDIO_VARIATIONS] variation submit failed", variation.number, jobErr);
      }
    }

    if (jobIds.length === 0) {
      return NextResponse.json(
        { error: "All variation jobs failed to submit. Please try again." },
        { status: 502 }
      );
    }

    const updated = await prismadb.influencer.update({
      where: { id },
      data: {
        characterStudioVariations: jobIds,
        characterStudioStep: "variations",
      },
    });

    return NextResponse.json({ character: updated, jobIds });
  } catch (err: any) {
    console.error("[CHARACTER-STUDIO_VARIATIONS]", err?.message || err);
    return NextResponse.json(
      { error: "Failed to generate variations." },
      { status: 500 }
    );
  }
}
