// app/api/image-understand/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { ModelEnum, PromptGenerationInput } from "@/types/prompt";
import { submitFalJob } from "@/lib/fal-client";
import { moderateAndLog } from "@/lib/content-moderation";


export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const data: PromptGenerationInput = await req.json();

    if (!data) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    if (data.input_concept) {
      const moderation = await moderateAndLog({
        userId: userId ?? null,
        endpoint: "ai.image-understand",
        prompt: data.input_concept,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
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
