import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { absoluteUrl } from "@/lib/utils";
import axios from "axios";
import { ClarityUpscalerInput, getUpscaleVariant, UpscaleModel } from "@/types/upscale";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { canUseUpscaleModel, resolveAccessTier } from "@/lib/plan-access";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const upscales = await prismadb.upscaled.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ upscales });
  } catch (error) {
    console.error("Failed to fetch upscaled images", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: ClarityUpscalerInput = await req.json();

    const subscription = await prismadb.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const access = resolveAccessTier(subscription?.plan?.tier);

    if (!canUseUpscaleModel(access, data.model)) {
      return NextResponse.json(
        { error: "This upscale model requires a higher plan." },
        { status: 403 }
      );
    }

    const { canUse, creditCost } = await checkAvailableCredit({
      userId: userId,
      tool: ToolType.IMAGE_UPSCALER,
      variant: getUpscaleVariant(data),
    });

    if (!canUse) {
      return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
    }

    if (data.model === UpscaleModel.BytedanceVideo) {
      if (!data.video_url) {
        return NextResponse.json({ error: "Reference video is required" }, { status: 400 });
      }
    } else {
      if (!data.image_url) {
        return NextResponse.json({ error: "Reference image is required" }, { status: 400 });
      }
    }

    const falRes = await axios.post(
      absoluteUrl("/api/ai/image-upscale"),
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      });

    const { requestId } = falRes.data;
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 500 });
    }

    await prismadb.upscaled.create({
      data: {
        id: requestId,
        userId,
        originalImage: data.video_url || data.image_url,
        upscaledImage: "",
        scale: data.upscale_factor || 2,
        steps: data.num_inference_steps ?? 50,
        dynamic: data.seed ?? 42,
        creativity: data.creativity ?? 0.5,
        resemblance: data.resemblance ?? 0.5,
        promptAdherence: data.guidance_scale ?? 7.5,
        safetyFilter: data.enable_safety_checker ?? true,
        prompt: data.prompt || (data.model === UpscaleModel.BytedanceVideo ? "Video upscale" : "Image upscale"),
        negativePrompt: data.negative_prompt,
        reason: { model: data.model },
        status: "queued",
        creditUsed: 0,
      },
    });

    console.log(`[UPSCALE TOOLS] ✅ Upscale job queued (requestId: ${requestId})`);
    return NextResponse.json({ jobId: requestId }, { status: 200 });

  } catch (err: any) {
    console.error("[UPSCALE TOOLS] ❌ POST error:", err.response?.data || err.message || err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
