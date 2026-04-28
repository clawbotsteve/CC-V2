import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { ImageGenerationModel, NanoBannaProInput } from "@/types/image";
import { submitFalJob } from "@/lib/fal-client";
import { aspectToImageSize, imageSizeToAspect, normalizeAspect } from "@/lib/aspect-ratio";
import { moderateAndLog } from "@/lib/content-moderation";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body: NanoBannaProInput = await req.json();
    const webhookUrl = getWebhookUrl("/api/webhook/image");

    if (body.prompt) {
      const moderation = await moderateAndLog({
        userId: userId ?? null,
        endpoint: "ai.image.nano-banna-pro",
        prompt: body.prompt,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
    }

    // Ensure aspect ratio selection always controls effective size on provider side.
    const normalizedAspect = normalizeAspect(body.aspect_ratio as any) || imageSizeToAspect(body.image_size);
    if (!normalizedAspect) {
      return NextResponse.json(
        { error: "Missing or invalid aspect ratio for Nano Banana 2", received: body.aspect_ratio },
        { status: 400 }
      );
    }
    const normalizedImageSize = aspectToImageSize(normalizedAspect);

    const normalizedResolution =
      body.output_resolution === "4k"
        ? "4K"
        : body.output_resolution === "2k"
          ? "2K"
          : body.output_resolution === "1k"
            ? "1K"
            : undefined;

    console.log("[NANO-BANANA-2 text] payload", {
      aspect_ratio: normalizedAspect,
      image_size: normalizedImageSize,
      output_resolution: normalizedResolution,
    });

    const { request_id } = await submitFalJob(ImageGenerationModel.NanoBannaPro, {
      input: {
        prompt: body.prompt,
        seed: body.seed,
        num_images: body.num_images || 1,
        output_format: body.output_format || "png",
        output_resolution: normalizedResolution,
        resolution: normalizedResolution,
        aspect_ratio: normalizedAspect,
        aspectRatio: normalizedAspect,
        image_size: normalizedImageSize,
        imageSize: normalizedImageSize,
      },
      webhookUrl,
    });

    return NextResponse.json({ requestId: request_id });
  } catch (error) {
    console.error("Nano Banana 2 (text) generate error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
