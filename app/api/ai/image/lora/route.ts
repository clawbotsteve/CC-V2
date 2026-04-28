import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { ImageGenerationModel, LoraInput } from "@/types/image";
import { submitFalJob } from "@/lib/fal-client";
import { moderateAndLog } from "@/lib/content-moderation";


export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body: LoraInput = await req.json();

    if (body.prompt) {
      const moderation = await moderateAndLog({
        userId: userId ?? null,
        endpoint: "ai.image.lora",
        prompt: body.prompt,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image");

    const { request_id } = await submitFalJob(ImageGenerationModel.Lora, {
      input: {
        enable_safety_checker: body.enable_safety_checker,
        guidance_scale: body.guidance_scale,
        image_size: body.image_size,
        loras: body.loras,
        num_images: body.num_images,
        num_inference_steps: body.num_inference_steps,
        output_format: body.output_format,
        prompt: body.prompt,
        seed: body.seed,
      },
      webhookUrl,
    });

    return NextResponse.json({ requestId: request_id });

  } catch (error) {
    console.error("Image generate error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
