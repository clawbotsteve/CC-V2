import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import prismadb from "@/lib/prismadb";
import { compilePrompt, getRandomVoice, getWebhookUrl } from "@/lib/utils";
import {
  avatarImagePrompt,
  avatarVideoPrompt,
  systemPromptTemplate,
  userPromptTemplate,
} from "@/constants";
import { submitFalJob } from "@/lib/fal-client";

fal.config({
  credentials: process.env.FAL_API_KEY!,
});

type GenerateVideoRequestBody = {
  userId: string;
  influencerId: string;
  loraUrl: string;
  avatarImageUrl: string;
};

enum voiceResponse {
  Roger = "Roger",
  Aria = "Aria",
  Sarah = "Sarah",
  Laura = "Laura",
  Charlie = "Charlie",
  George = "George",
  Callum = "Callum",
  River = "River",
  Liam = "Liam",
  Charlotte = "Charlotte",
  Alice = "Alice",
  Matilda = "Matilda",
  Will = "Will",
  Jessica = "Jessica",
  Eric = "Eric",
  Chris = "Chris",
  Brian = "Brian",
  Daniel = "Daniel",
  Lily = "Lily",
  Bill = "Bill"
}

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Received request to generate video");

    const {
      userId,
      influencerId,
      loraUrl,
      avatarImageUrl,
    }: GenerateVideoRequestBody = await req.json();

    console.log("📥 Parsed body:", { userId, influencerId, loraUrl, avatarImageUrl });

    if (!userId || !loraUrl || !avatarImageUrl) {
      console.warn("⚠️ Missing required fields");
      return NextResponse.json(
        { error: "userId, loraUrl, and avatarImage are required." },
        { status: 400 }
      );
    }

    console.log("🔍 Fetching influencer:", influencerId);
    const influencer = await prismadb.influencer.findFirst({
      where: { id: influencerId },
    });

    if (!influencer) {
      console.warn("⚠️ Influencer not found");
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }

    console.log("🎨 Generating avatar image from:", avatarImageUrl);
    const avatarImage = await fal.subscribe("fal-ai/flux-lora/image-to-image", {
      input: {
        prompt: avatarImagePrompt,
        image_url: avatarImageUrl,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
        output_format: "png",
        strength: 0.85,
        loras: [{ path: loraUrl }],
        image_size: "portrait_16_9",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("📡 Avatar image generation logs:");
          update.logs.map((log) => console.log("📝", log.message));
        }
      },
    });

    const avatarImageUrlGenerated = avatarImage.data.images[0].url;
    console.log("✅ Avatar image generated:", avatarImageUrlGenerated);
    console.log("🆔 Avatar image request ID:", avatarImage.requestId);
    await prismadb.influencer.update({
      where: { id: influencer.id },
      data: {
        avatarImageUrl: avatarImageUrlGenerated
      },
    });

    console.log("🧠 Compiling prompts for video narration...");
    const systemPrompt = compilePrompt(systemPromptTemplate, {
      name: influencer.name,
    });

    const userPrompt = compilePrompt(userPromptTemplate, {
      name: influencer.name,
      description: influencer.description as string,
    });

    console.log("💬 Sending prompt to LLM...");
    const videoPrompt = await fal.subscribe("fal-ai/any-llm", {
      input: {
        model: "openai/gpt-4o-mini",
        prompt: userPrompt,
        system_prompt: systemPrompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("📡 Prompt generation logs:");
          update.logs.map((log) => console.log("📝", log.message));
        }
      },
    });

    const generatedPrompt = videoPrompt.data.output;
    console.log("🧾 Generated video prompt:", generatedPrompt);
    console.log("🆔 Prompt generation request ID:", videoPrompt.requestId);
    await prismadb.influencer.update({
      where: { id: influencer.id },
      data: {
        introPrompt: generatedPrompt
      },
    });

    console.log("🎙️ Selecting random voice for:", influencer.gender);
    const voice = getRandomVoice(influencer.gender as "male" | "female") as voiceResponse;

    const webhookUrl = getWebhookUrl("/api/webhook/train/video-intro");
    console.log("🔗 Webhook URL set to:", webhookUrl);

    console.log("🎥 Submitting video generation job...");
    const { request_id } = await submitFalJob("fal-ai/ai-avatar/single-text", {
      input: {
        image_url: avatarImageUrlGenerated,
        text_input: generatedPrompt,
        voice: voice,
        prompt: avatarVideoPrompt,
      },
      webhookUrl: webhookUrl,
    });

    console.log("✅ Video generation job submitted. Request ID:", request_id);

    console.log("📝 Updating influencer DB with request ID...");
    await prismadb.influencer.update({
      where: { id: influencer.id },
      data: {
        introVideoRequestId: request_id,
      },
    });

    console.log("📦 All steps completed successfully.");
    return NextResponse.json({
      success: true,
      requestId: request_id,
      prompt: generatedPrompt,
      message: "Video generation job submitted successfully.",
    });
  } catch (err) {
    console.error("❌ [FAL_VIDEO_GENERATION_ERROR]", err);
    return NextResponse.json(
      { error: "Video job submission failed." },
      { status: 500 }
    );
  }
}
