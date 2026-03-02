import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { ImageGenerationModel, V1Input } from "@/types/image";
import { submitFalJob } from "@/lib/fal-client";


export async function POST(req: NextRequest) {
  try {
    const body: V1Input = await req.json();

    const webhookUrl = getWebhookUrl("/api/webhook/image");

    const { request_id } = await submitFalJob(ImageGenerationModel.V1, {
      input: {
        prompt: body.prompt,
        image_size: body.image_size,
        seed: body.seed,
        num_images: body.num_images,
        enable_safety_checker: body.enable_safety_checker,
        safety_tolerance: body.enable_safety_checker ? body.safety_tolerance : "6",
        output_format: body.output_format,
      },
      webhookUrl,
    });

    return NextResponse.json({ requestId: request_id });
  } catch (error) {
    console.error("Image generate error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
