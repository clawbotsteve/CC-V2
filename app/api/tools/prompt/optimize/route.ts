import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { deductCredit } from "@/lib/charge-user";
import { ToolType } from "@prisma/client";

fal.config({
    credentials: process.env.FAL_API_KEY!,
});

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check available credits before optimization
        const { canUse, creditCost } = await checkAvailableCredit({
            userId: userId,
            tool: ToolType.PROMPT_OPTIMIZER,
        });

        if (!canUse) {
            return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
        }

        const body = await req.json();
        const { prompt, image_url } = body;

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid prompt" },
                { status: 400 }
            );
        }

        console.log("🔧 Optimizing prompt:", prompt.substring(0, 100) + "...");
        if (image_url) {
            console.log("🖼️ With reference image:", image_url);
        }

        // System prompt for the LLM
        const systemPrompt = `You are an expert AI prompt engineer specializing in image and video generation prompts. Your task is to optimize and enhance prompts to make them more effective for AI generation.

When optimizing a prompt:
1. Keep the core concept and intent
2. Add specific details about composition, lighting, style, mood, and atmosphere
3. Include technical aspects like camera angles, color grading, and quality descriptors
4. Make it more vivid and descriptive
5. Ensure it's clear and well-structured

Return ONLY the optimized prompt without any explanation, introduction, or additional commentary.`;

        let optimizedPrompt: string;

        if (image_url) {
            // Use LLaVA-NeXT for image-aware optimization
            console.log("💬 Using LLaVA-NeXT for image-aware prompt optimization...");

            const visionPrompt = `${systemPrompt}

Analyze this image and optimize the following prompt for AI image/video generation. Consider the visual elements, style, composition, and mood of the reference image when enhancing the prompt.

Original prompt: ${prompt}

Provide an optimized, detailed prompt that incorporates relevant visual details from the image while maintaining the core intent. Return ONLY the optimized prompt.`;

            const result = await fal.subscribe("fal-ai/llava-next", {
                input: {
                    prompt: visionPrompt,
                    image_url: image_url,
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS") {
                        console.log("📡 Optimizing with image context...");
                        update.logs?.map((log) => console.log("📝", log.message));
                    }
                },
            });

            optimizedPrompt = result.data.output?.trim() || prompt;
            console.log("✅ Prompt optimized with image analysis");
            console.log("🆔 Request ID:", result.requestId);
        } else {
            // Use any-llm for text-only optimization
            console.log("💬 Using text-only prompt optimization...");

            const textPrompt = `Optimize this prompt for AI image/video generation:\\n\\n${prompt}`;

            const result = await fal.subscribe("fal-ai/any-llm", {
                input: {
                    model: "openai/gpt-4o-mini",
                    prompt: textPrompt,
                    system_prompt: systemPrompt,
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS") {
                        console.log("📡 Optimizing prompt...");
                        update.logs?.map((log) => console.log("📝", log.message));
                    }
                },
            });

            optimizedPrompt = result.data.output?.trim() || prompt;
            console.log("✅ Prompt optimized successfully");
            console.log("🆔 Request ID:", result.requestId);
        }

        // Deduct credits after successful optimization
        await deductCredit({
            userId,
            tool: ToolType.PROMPT_OPTIMIZER,
        });

        return NextResponse.json({
            success: true,
            optimizedPrompt,
            originalPrompt: prompt,
            hasImageContext: !!image_url,
            creditsUsed: creditCost,
        });
    } catch (error: any) {
        console.error("❌ Prompt optimization error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to optimize prompt" },
            { status: 500 }
        );
    }
}
