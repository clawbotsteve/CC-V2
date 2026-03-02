// app/api/image-edit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { ImageEditorInput } from "@/types/editor";
import { submitFalJob } from "@/lib/fal-client";


export async function POST(req: NextRequest) {
  try {
    const data: ImageEditorInput = await req.json();

    if (!data.image_url || !data.prompt) {
      return NextResponse.json({ error: "Missing imageUrl or prompt" }, { status: 400 });
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image-edit");
    const input = {
      acceleration: data.acceleration,
      enable_safety_checker: data.enable_safety_checker,
      guidance_scale: data.guidance_scale,
      image_url: data.image_url,
      num_images: data.num_images,
      num_inference_steps: data.num_inference_steps,
      output_format: data.output_format,
      prompt: data.prompt,
      seed: data.seed,
      strength: data.strength,
    }

    // Submit to FAL queue
    const { request_id } = await submitFalJob("fal-ai/flux/dev/image-to-image", {
      input,
      webhookUrl,
    });

    return NextResponse.json({
      success: true,
      requestId: request_id,
      message: "Request submitted. You will receive webhook callback upon completion.",
    });
  } catch (err) {
    console.error("FAL API Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
