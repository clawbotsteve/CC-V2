import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { submitFalJob } from "@/lib/fal-client";
import { moderateAndLog } from "@/lib/content-moderation";
// import { ExtendedImageJobInput } from "../../tools/image/route";


export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const hasLora = body.model !== "none";
    const seed = Math.floor(Math.random() * 9_000_000) + 1_000_000;

    if (body.prompt) {
      const moderation = await moderateAndLog({
        userId: userId ?? null,
        endpoint: "ai.image",
        prompt: body.prompt,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image");

    if (!hasLora) {
      if (body.image) {
        const { request_id } = await submitFalJob("fal-ai/flux-pro/kontext", {
          input: {
            prompt: body.prompt,
            image_url: body.image,
            aspect_ratio: body.aspectRatio,
            seed: seed,
            num_images: body.numImages,
            // enable_safety_checker: body.safetyEnabled,
            safety_tolerance: body.safetyEnabled ? body.safetyLevel : "6",
            output_format: body.outputFormat,
          },
          webhookUrl,
        });

        return NextResponse.json({ requestId: request_id });
      } else {
        const { request_id } = await submitFalJob("fal-ai/flux-pro/v1.1", {
          input: {
            prompt: body.prompt,
            image_size: body.aspectRatio,
            seed: seed,
            num_images: body.numImages,
            enable_safety_checker: body.safetyEnabled,
            safety_tolerance: body.safetyEnabled ? body.safetyLevel : "6",
            output_format: body.outputFormat,
          },
          webhookUrl,
        });

        return NextResponse.json({ requestId: request_id });
      }
    }

    if (hasLora) {
      const { request_id } = await submitFalJob("fal-ai/flux-lora", {
        input: {
          prompt: body.prompt,
          image_size: body.aspectRatio,
          seed,
          num_inference_steps: body.numInferenceStep,
          loras: [body.loras!],
          guidance_scale: body.guidanceScale,
          num_images: body.numImages,
          enable_safety_checker: true,
          output_format: body.outputFormat,
        },
        webhookUrl,
      });

      return NextResponse.json({ requestId: request_id });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Image generate error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
