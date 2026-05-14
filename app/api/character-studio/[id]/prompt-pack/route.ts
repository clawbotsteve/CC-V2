import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
// Provider-routed. Picks FAL or Replicate based on IMAGE_PROVIDER.
import { submitImageJob as submitFalJob } from "@/lib/image-provider";
import { ImageGenerationModel } from "@/types/image";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { Niche, NICHE_KEYS } from "@/lib/character-studio/prompt-scaffolds";
import { buildCharacterDescriptors, fillNichePromptPack } from "@/lib/character-studio/fill-prompts";

/**
 * POST /api/character-studio/[id]/prompt-pack
 * Step 5 of the wizard. Kicks off the 15 niche prompt-pack jobs in
 * parallel via GPT Image 2 (synchronous LoRA training in Step 4 takes
 * 5-15 minutes, so we deliberately fire the prompt pack at the same
 * time — the user gets results to look at while training runs).
 *
 * The prompt pack does NOT use the LoRA — these are zero-shot GPT
 * Image 2 generations from the textual {character} description. Once
 * the LoRA is trained, the user can re-run any prompt with the LoRA
 * loaded for proper likeness, but the initial pack is a "before"
 * preview that's fast and free of training-time dependency.
 *
 * Returns immediately with {jobId, scaffoldNumber, label} for each
 * prompt. The wizard polls /api/character-studio/[id] for completion.
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
    if (!character.niche || !NICHE_KEYS.includes(character.niche as Niche)) {
      return NextResponse.json({ error: "Character niche is not set." }, { status: 400 });
    }
    const existing = (character.characterStudioPromptPack ?? null) as
      | Array<{ jobId?: string }>
      | null;
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Prompt pack has already been generated for this character." },
        { status: 400 }
      );
    }

    // Pre-flight credit check. The pack is 15 GPT Image 2 medium
    // generations. We require headroom for the full pack so partial
    // failures aren't possible (better UX than 8/15 succeeding).
    const variantKey = "gpt_image_2_medium";
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.IMAGE_GENERATOR,
      variant: variantKey,
    });

    // Fill the 15 scaffolds with the character's descriptors.
    const charType = (character.characterStudioCharType ?? "female") as
      | "female"
      | "male"
      | "animated";
    const descriptors = buildCharacterDescriptors({
      name: character.name,
      charType,
      description: character.description ?? "",
    });
    const filled = fillNichePromptPack(character.niche as Niche, {
      character: descriptors.character,
      characterShort: descriptors.characterShort,
      brand: character.characterStudioBrand ?? undefined,
      product: character.characterStudioProduct ?? undefined,
    });

    const totalCost = creditCheck.creditCost * filled.length;
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

    const webhookUrl = getWebhookUrl("/api/webhook/image");
    const pack: Array<{
      scaffoldNumber: number;
      label: string;
      contentType: string;
      aspectRatio: string;
      prompt: string;
      jobId: string;
      hasText?: boolean;
      isWildcard?: boolean;
    }> = [];

    // Submit each prompt as its own GPT Image 2 job. Serial submit (not
    // Promise.all) for the same reason as variations — keeps the FAL
    // queue load reasonable.
    for (const { scaffold, prompt } of filled) {
      const moderation = await moderateAndLog({
        userId,
        endpoint: "character-studio.prompt-pack",
        prompt,
      });
      if (!moderation.allowed) {
        console.warn("[CHARACTER-STUDIO_PROMPT_PACK] blocked by moderation", scaffold.number);
        continue;
      }

      try {
        const resp = await submitFalJob(ImageGenerationModel.GptImage2, {
          input: {
            prompt,
            quality: "medium",
            num_images: 1,
            output_format: "png",
            aspect_ratio: scaffold.aspectRatio,
          },
          webhookUrl,
        });

        if (!resp?.request_id) continue;

        await prismadb.generatedImage.create({
          data: {
            id: resp.request_id,
            userId,
            imageUrl: "",
            prompt,
            variant: "sfw",
            creditVariant: variantKey,
            contentType: "sfw",
            nsfwFlag: false,
            status: "queued",
          },
        });

        pack.push({
          scaffoldNumber: scaffold.number,
          label: scaffold.label,
          contentType: scaffold.contentType,
          aspectRatio: scaffold.aspectRatio,
          prompt,
          jobId: resp.request_id,
          hasText: scaffold.hasText,
          isWildcard: scaffold.isWildcard,
        });
      } catch (jobErr) {
        console.error("[CHARACTER-STUDIO_PROMPT_PACK] job submit failed", scaffold.number, jobErr);
      }
    }

    if (pack.length === 0) {
      return NextResponse.json(
        { error: "All prompt pack jobs failed to submit. Please try again." },
        { status: 502 }
      );
    }

    const updated = await prismadb.influencer.update({
      where: { id },
      data: {
        characterStudioPromptPack: pack as any,
        characterStudioStep: character.characterStudioStep === "training" ? "training" : "prompts",
      },
    });

    return NextResponse.json({ character: updated, pack });
  } catch (err: any) {
    console.error("[CHARACTER-STUDIO_PROMPT_PACK]", err?.message || err);
    return NextResponse.json(
      { error: "Failed to generate prompt pack." },
      { status: 500 }
    );
  }
}
