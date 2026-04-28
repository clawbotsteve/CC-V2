import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { ImageGenerationModel, NanoBanana2Input } from "@/types/image";
import { submitFalJob, uploadImageUrlToFalStorage } from "@/lib/fal-client";
import { aspectToImageSize, imageSizeToAspect, normalizeAspect } from "@/lib/aspect-ratio";
import { moderateAndLog } from "@/lib/content-moderation";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body: NanoBanana2Input = await req.json();
    const webhookUrl = getWebhookUrl("/api/webhook/image");

    if (body.prompt) {
      const moderation = await moderateAndLog({
        userId: userId ?? null,
        endpoint: "ai.image.nano-banana-2",
        prompt: body.prompt,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
    }

    const imageUrls = body.image_urls?.filter(Boolean) ?? [];
    if (imageUrls.length === 0) {
      return NextResponse.json({ error: "Nano Banana 2 requires at least 1 input photo (max 5)." }, { status: 400 });
    }

    const falHostedImageUrls = await Promise.all(
      imageUrls.slice(0, 5).map(async (url) => {
        try {
          return await uploadImageUrlToFalStorage(url);
        } catch (err) {
          console.error("[NANO BANANA 2] Failed to upload input image to Fal storage:", url, err);
          throw new Error("One or more input photos could not be uploaded to Fal storage. Please re-upload and try again.");
        }
      })
    );

    // Ensure aspect ratio selection always controls effective size on provider side.
    const normalizedAspect = normalizeAspect(body.aspect_ratio as any) || imageSizeToAspect(body.image_size);
    if (!normalizedAspect) {
      return NextResponse.json(
        { error: "Missing or invalid aspect ratio for Nano Banana 2 Edit", received: body.aspect_ratio },
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

    console.log("[NANO-BANANA-2 edit] payload", {
      aspect_ratio: normalizedAspect,
      image_size: normalizedImageSize,
      output_resolution: normalizedResolution,
    });

    const { request_id } = await submitFalJob(ImageGenerationModel.NanoBanana2, {
      input: {
        prompt: body.prompt,
        aspect_ratio: normalizedAspect,
        aspectRatio: normalizedAspect,
        image_size: normalizedImageSize,
        imageSize: normalizedImageSize,
        output_resolution: normalizedResolution,
        resolution: normalizedResolution,
        image_urls: falHostedImageUrls,
        seed: body.seed,
        num_images: body.num_images || 1,
        output_format: body.output_format || "png",
      },
      webhookUrl,
    });

    return NextResponse.json({ requestId: request_id });
  } catch (error) {
    console.error("Nano Banana 2 generate error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
