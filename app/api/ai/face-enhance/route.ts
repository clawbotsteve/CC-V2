// app/api/image-edit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { FaceEnhanceInput } from "@/types/enhance";
import { submitFalJob } from "@/lib/fal-client";


export async function POST(req: NextRequest) {
  try {
    const body: FaceEnhanceInput = await req.json();

    // Your public webhook endpoint that FAL will call after processing
    const webhookUrl = getWebhookUrl("/api/webhook/face-enhance");
    const input = {
      aspect_ratio: body.aspect_ratio,
      guidance_scale: body.guidance_scale,
      image_url: body.image,
      num_inference_steps: body.num_inference_step,
      output_format: body.output_format,
      safety_tolerance: body.safety_level,
      seed: Math.floor(Math.random() * 100) + 1,
    }

    // Submit to FAL queue
    const { request_id } = await submitFalJob("fal-ai/image-editing/face-enhancement", {
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
