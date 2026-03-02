// app/api/image-understand/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { ModelEnum, PromptGenerationInput } from "@/types/prompt";
import { submitFalJob } from "@/lib/fal-client";


export async function POST(req: NextRequest) {
  try {
    const data: PromptGenerationInput = await req.json();

    if (!data) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image-understand");
    const input = {
      camera_direction: data.camera_direction,
      custom_elements: data.custom_elements,
      camera_style: data.camera_style,
      input_concept: data.input_concept,
      image_url: data.image_url,
      model: data.model,
      pacing: data.pacing,
      prompt_length: data.prompt_length,
      special_effects: data.special_effects,
      style: data.style,
      enable_safety_checker: data.enable_safety_checker,
    }

    const { request_id } = await submitFalJob("fal-ai/video-prompt-generator", {
      input,
      webhookUrl,
    });

    return NextResponse.json({
      success: true,
      requestId: request_id,
      message: "Image submitted. You will receive webhook callback upon completion.",
    });
  } catch (error) {
    console.error("FAL image-describe error:", error);
    return NextResponse.json({ error: "Failed to submit image" }, { status: 500 });
  }
}
