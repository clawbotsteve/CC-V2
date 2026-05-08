import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { moderateAndLog } from "@/lib/content-moderation";
import { ImageGenerationModel } from "@/types/image";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { deductCredit } from "@/lib/charge-user";
import { buildCharacterDescriptors } from "@/lib/character-studio/fill-prompts";

fal.config({ credentials: process.env.FAL_API_KEY! });

interface ReferenceBody {
  /**
   * "generate" → call GPT Image 2 with a prompt synthesized from the
   *   wizard inputs. (Default for MVP — most users will pick this.)
   * "upload"   → user uploaded their own reference; the URL was already
   *   stashed via /api/upload and we just record it.
   */
  mode: "generate" | "upload";
  /** Required when mode === "upload". */
  uploadUrl?: string;
  /**
   * Optional explicit prompt override. When omitted (generate mode), we
   * build a clean GPT Image 2 portrait prompt from the wizard inputs
   * (name + charType + description). Most users won't need to override.
   */
  promptOverride?: string;
}

/** Build a clean Step-2 base-reference portrait prompt. */
function buildReferencePrompt(args: {
  characterDescription: string;
  charType: "female" | "male" | "animated";
}): string {
  const isAnimated = args.charType === "animated";

  if (isAnimated) {
    return `Studio reference portrait of ${args.characterDescription}. Three-quarter angle from the chest up, looking softly toward camera, neutral confident expression, plain warm-cream backdrop, soft even studio lighting, full character art, clean lineart and color, designed for use as a model reference. 9:16 vertical.`;
  }

  return `Studio reference portrait of ${args.characterDescription}. Three-quarter angle from the chest up, looking softly toward camera, neutral confident expression, plain warm-cream studio backdrop, soft even daylight from a tall window camera-left, photoreal skin pore detail, simple solid neutral wardrobe, no jewelry, no logos, sharp focus on the eyes, clean catchlight, designed to be used as a model reference. 9:16 vertical.`;
}

/**
 * POST /api/character-studio/[id]/reference
 * Step 2 of the wizard. Either:
 *   - generates a base reference portrait via GPT Image 2 (synchronous,
 *     fal.subscribe — typically 8-15 seconds) and stores the URL, or
 *   - records the URL of a user-uploaded reference image.
 *
 * Synchronous generation is acceptable here because Step 2 is a single
 * image and the user is actively waiting on the wizard. Step 3 (six
 * variations) and Step 5 (fifteen prompt pack images) use the async
 * webhook flow instead.
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
    const body: ReferenceBody = await req.json();

    const character = await prismadb.influencer.findFirst({
      where: { id, userId, isActive: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    if (!character.characterStudioStep) {
      return NextResponse.json(
        { error: "Character is not a Character Studio draft." },
        { status: 400 }
      );
    }

    if (body.mode === "upload") {
      if (!body.uploadUrl) {
        return NextResponse.json({ error: "Upload URL is required." }, { status: 400 });
      }

      const updated = await prismadb.influencer.update({
        where: { id },
        data: {
          characterStudioRef: body.uploadUrl,
          avatarImageUrl: body.uploadUrl,
          characterStudioStep: "reference",
        },
      });

      return NextResponse.json({ character: updated, imageUrl: body.uploadUrl });
    }

    // Generate mode. Build a portrait prompt from the wizard inputs
    // (or use the user's override) and synchronously call GPT Image 2.
    const charType = (character.characterStudioCharType ?? "female") as
      | "female"
      | "male"
      | "animated";
    const { character: characterDescriptor } = buildCharacterDescriptors({
      name: character.name,
      charType,
      description: character.description ?? "",
    });

    const prompt =
      body.promptOverride?.trim() ||
      buildReferencePrompt({ characterDescription: characterDescriptor, charType });

    // Run the prompt through the same moderation pipeline every other
    // gen endpoint uses. Fail closed if it trips a flag.
    const moderation = await moderateAndLog({
      userId,
      endpoint: "character-studio.reference",
      prompt,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Pre-flight credit check. We charge as if this were a regular
    // gpt-image-2 medium-quality generation (Step 2 always uses
    // medium quality regardless of plan).
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.IMAGE_GENERATOR,
      variant: "gpt_image_2_medium",
    });
    if (!creditCheck.canUse) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${creditCheck.creditCost}` },
        { status: 403 }
      );
    }

    // Synchronous call. fal.subscribe waits for completion; the response
    // contains the final image URL directly so we don't need to plumb
    // through the webhook + polling dance.
    const result = await fal.subscribe(ImageGenerationModel.GptImage2, {
      input: {
        prompt,
        quality: "medium",
        num_images: 1,
        output_format: "png",
        aspect_ratio: "9:16",
      },
      logs: false,
    });

    const imageUrl =
      (result?.data as any)?.images?.[0]?.url ||
      (result?.data as any)?.image?.url ||
      "";

    if (!imageUrl) {
      console.error("[CHARACTER-STUDIO] reference: no image url in fal result", result);
      return NextResponse.json(
        { error: "Reference generation failed — please try again." },
        { status: 502 }
      );
    }

    // Charge credits AFTER successful generation so failed jobs don't
    // burn the user's balance. deductCredit is the right helper for
    // synchronous fal.subscribe flows because there's no GeneratedImage
    // row to attach the charge to (those are created by the webhook
    // path, not the synchronous one).
    await deductCredit({
      userId,
      tool: ToolType.IMAGE_GENERATOR,
      variant: "gpt_image_2_medium",
    });

    const updated = await prismadb.influencer.update({
      where: { id },
      data: {
        characterStudioRef: imageUrl,
        avatarImageUrl: imageUrl,
        characterStudioStep: "reference",
      },
    });

    return NextResponse.json({ character: updated, imageUrl });
  } catch (err: any) {
    console.error("[CHARACTER-STUDIO_REFERENCE]", err?.message || err);
    return NextResponse.json(
      { error: "Failed to generate reference image. Please try again." },
      { status: 500 }
    );
  }
}
