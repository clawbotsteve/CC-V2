import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { ImageGenerationModel } from "@/types/image";
import type { GptImage2Input } from "@/types/image";
import { submitFalJob } from "@/lib/fal-client";
import { moderateAndLog } from "@/lib/content-moderation";

/**
 * Raw provider proxy for openai/gpt-image-2 via FAL.
 * Called by the user-facing /api/tools/image route after access + credit checks.
 * https://fal.ai/models/openai/gpt-image-2
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body: GptImage2Input = await req.json();

    if (body.prompt) {
      const moderation = await moderateAndLog({
        userId: userId ?? null,
        endpoint: "ai.image.gpt-image-2",
        prompt: body.prompt,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image");

    // Quality enforcement is the caller's job (the public-facing
    // /api/tools/image route) since it knows the user's plan tier. This raw
    // proxy just relays whatever quality is requested; default to "medium"
    // for direct API consumers.
    const quality = body.quality ?? "medium";

    const { request_id } = await submitFalJob(ImageGenerationModel.GptImage2, {
      input: {
        prompt: body.prompt,
        quality,
        num_images: body.num_images ?? 1,
        output_format: body.output_format ?? "png",
        // Pass through whichever sizing field the caller supplied; FAL
        // accepts either an aspect_ratio preset or an image_size object.
        ...(body.aspect_ratio ? { aspect_ratio: body.aspect_ratio } : {}),
        ...(body.image_size ? { image_size: body.image_size } : {}),
        ...(body.seed !== undefined ? { seed: body.seed } : {}),
      },
      webhookUrl,
    });

    return NextResponse.json({ requestId: request_id });
  } catch (error: any) {
    console.error("[GPT-IMAGE-2] Generate error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
