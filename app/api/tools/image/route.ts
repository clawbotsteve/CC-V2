import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { absoluteUrl } from "@/lib/utils";
import axios from "axios";
import { startOfDay } from "date-fns";
import { ImageGenerationInput, ImageGenerationModel, LoraInput, NanoBannaProInput, NanoBanana2Input, Soul2Input, V1Input } from "@/types/image";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { getFalJobResult } from "@/lib/fal-client";
import { aspectToImageSize, normalizeAspect } from "@/lib/aspect-ratio";
import { canUseImageModel, requiredPlanForImageModel, resolveAccessTier } from "@/lib/plan-access";

function getImageCreditVariant(input: ImageGenerationInput): string {
  if (input.model === ImageGenerationModel.NanoBanana2 || input.model === ImageGenerationModel.NanoBannaPro || input.model === ImageGenerationModel.NanoBanana2Base) {
    const res = input.output_resolution ?? "1k";
    return `nano_banana_2_${res}`;
  }
  return input.enable_safety_checker ? "sfw" : "nsfw";
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const images = await prismadb.generatedImage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Opportunistic provider-sync: if DB rows are stuck queued/processing, try pulling Fal result directly.
    for (const img of images) {
      if ((img.status === "queued" || img.status === "processing") && !img.imageUrl) {
        const endpoints = [
          ImageGenerationModel.NanoBanana2,
          ImageGenerationModel.NanoBannaPro,
          ImageGenerationModel.V1,
          ImageGenerationModel.Lora,
        ];

        for (const endpoint of endpoints) {
          try {
            const result: any = await getFalJobResult(endpoint, img.id);
            const imageUrl =
              result?.imageUrl ||
              result?.image_url ||
              result?.images?.[0]?.url ||
              result?.images?.[0]?.image_url ||
              result?.output?.images?.[0]?.url ||
              result?.output?.images?.[0]?.image_url ||
              result?.output?.image?.url ||
              result?.payload?.images?.[0]?.url ||
              result?.payload?.images?.[0]?.image_url ||
              result?.data?.images?.[0]?.url ||
              result?.result?.images?.[0]?.url;
            if (imageUrl) {
              img.status = "completed" as any;
              img.imageUrl = imageUrl;
              try {
                await prismadb.generatedImage.update({
                  where: { id: img.id },
                  data: { status: "completed", imageUrl },
                });
              } catch {}
              break;
            }
          } catch {}
        }
      }
    }

    return NextResponse.json({ images });
  } catch (error: any) {
    console.warn("[IMAGE TOOLS] GET degraded fallback:", error);
    const details = process.env.NODE_ENV === "development"
      ? String(error?.message || error)
      : undefined;
    return NextResponse.json({ images: [], degraded: true, details }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.warn("[IMAGE TOOLS] POST - Unauthorized access, missing userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const data: ImageGenerationInput = await req.json();

    const subscription = await prismadb.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const access = resolveAccessTier(subscription?.plan?.tier);

    if (!canUseImageModel(access, data.model)) {
      return NextResponse.json(
        { error: `This image model requires the ${requiredPlanForImageModel(data.model)} plan.` },
        { status: 403 }
      );
    }

    const body: ImageGenerationInput = { ...data };

    // Platform safety enforcement: always enable safety checker, override user input
    body.enable_safety_checker = true;

    let canUse = true;
    let creditCost = 1;
    try {
      const creditCheck = await checkAvailableCredit({
        userId: userId,
        tool: ToolType.IMAGE_GENERATOR,
        variant: getImageCreditVariant(data),
      });
      canUse = creditCheck.canUse;
      creditCost = creditCheck.creditCost;
    } catch (creditErr) {
      console.warn("[IMAGE TOOLS] Credit check failed, continuing in degraded mode:", creditErr);
      if (process.env.NODE_ENV !== "development") {
        throw creditErr;
      }
    }

    if (!canUse) {
      return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
    }

    if (data.lora_id !== "none") {
      const trainedModel = await prismadb.influencer.findFirst({
        where: { id: data.lora_id },
        select: {
          loraUrl: true,
        },
      });

      if (!trainedModel) {
        console.error("[IMAGE TOOLS] POST - LoRA url not found for model:", data.lora_id);
        return NextResponse.json({ error: "LoRA url not found." }, { status: 500 });
      }

      body.loras = [
        {
          path: trainedModel.loraUrl!,
          scale: 1,
        }
      ];
    }

    console.log("[IMAGE TOOLS] POST - Sending image generation request");



    let falResponse;

    if (data.model === ImageGenerationModel.NanoBannaPro || data.model === ImageGenerationModel.NanoBanana2Base) {
      const normalizedAspect = normalizeAspect(body.aspect_ratio as any);
      if (!normalizedAspect) {
        return NextResponse.json({ error: "Aspect ratio is required for Nano Banana 2." }, { status: 400 });
      }
      const normalizedImageSize = aspectToImageSize(normalizedAspect);

      const data_ai: NanoBannaProInput = {
        prompt: body.prompt,
        image_url: data.model === ImageGenerationModel.NanoBanana2Base ? undefined : body.image_url,
        seed: body.seed,
        num_images: body.num_images,
        output_format: body.output_format,
        output_resolution: body.output_resolution,
        aspect_ratio: normalizedAspect,
        image_size: normalizedImageSize,
      };

      falResponse = await axios.post(absoluteUrl("/api/ai/image/nano-banna-pro"), data_ai, {
        headers: { "Content-Type": "application/json" },
      });
    } else if (data.model === ImageGenerationModel.NanoBanana2) {
      const inputImages = body.image_urls?.filter(Boolean) ?? (body.image_url ? [body.image_url] : []);
      if (inputImages.length === 0) {
        return NextResponse.json({ error: "Nano Banana 2 requires at least 1 input photo." }, { status: 400 });
      }

      const normalizedAspect = normalizeAspect(body.aspect_ratio as any);
      if (!normalizedAspect) {
        return NextResponse.json({ error: "Aspect ratio is required for Nano Banana 2 Edit." }, { status: 400 });
      }
      const normalizedImageSize = aspectToImageSize(normalizedAspect);

      const data_ai: NanoBanana2Input = {
        prompt: body.prompt,
        seed: body.seed,
        num_images: body.num_images,
        output_format: body.output_format,
        output_resolution: body.output_resolution,
        aspect_ratio: normalizedAspect,
        image_size: normalizedImageSize,
        image_urls: inputImages.slice(0, 5),
      };

      falResponse = await axios.post(absoluteUrl("/api/ai/image/nano-banana-2"), data_ai, {
        headers: { "Content-Type": "application/json" },
      });
    } else if (data.model === ImageGenerationModel.Soul2) {
      const data_ai: Soul2Input = {
        prompt: body.prompt,
        seed: body.seed,
        num_images: body.num_images,
        output_format: body.output_format,
        aspect_ratio: body.aspect_ratio,
      };

      falResponse = await axios.post(absoluteUrl("/api/ai/image/soul-2"), data_ai, {
        headers: { "Content-Type": "application/json" },
      });
    } else if (data.model === ImageGenerationModel.Lora) {
      const data_ai: LoraInput = {
        prompt: body.prompt,
        seed: body.seed,
        guidance_scale: body.guidance_scale!,
        image_size: body.image_size!,
        sync_mode: false,
        num_images: body.num_images,
        output_format: body.output_format,
        num_inference_steps: body.num_inference_steps!,
        loras: body.loras!,
        enable_safety_checker: body.enable_safety_checker!,
      };

      falResponse = await axios.post(absoluteUrl("/api/ai/image/lora"), data_ai, {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const data_ai: V1Input = {
        prompt: body.prompt,
        seed: body.seed,
        image_size: body.image_size!,
        sync_mode: false,
        num_images: body.num_images,
        enable_safety_checker: body.enable_safety_checker!,
        output_format: body.output_format,
        safety_tolerance: body.safety_tolerance!,
      };

      falResponse = await axios.post(absoluteUrl("/api/ai/image/v1"), data_ai, {
        headers: { "Content-Type": "application/json" },
      });
    }


    const { requestId } = falResponse && falResponse.data;
    if (!requestId) {
      console.error("[IMAGE TOOLS] POST - Missing requestId in response");
      return NextResponse.json({ error: "Missing requestId" }, { status: 500 });
    }

    const isNSFW = !data.enable_safety_checker;

    try {
      await prismadb.dailyUsage.upsert({
        where: {
          userId_date: { userId, date: today },
        },
        create: {
          userId,
          date: today,
          imageCount: data.enable_safety_checker ? 0 : 1,
        },
        update: {
          imageCount: data.enable_safety_checker ? undefined : { increment: 1 },
        },
      });

      await prismadb.generatedImage.create({
        data: {
          id: requestId,
          userId,
          imageUrl: "",
          prompt: data.prompt,
          variant: isNSFW ? "nsfw" : "sfw",
          contentType: isNSFW ? "nsfw" : "sfw",
          nsfwFlag: isNSFW,
          status: "queued",
        },
      });
    } catch (dbErr) {
      console.warn("[IMAGE TOOLS] DB write skipped in degraded mode:", dbErr);
      if (process.env.NODE_ENV !== "development") {
        throw dbErr;
      }
    }

    console.log(`[IMAGE TOOLS] POST - Job queued with requestId: ${requestId}`);

    return NextResponse.json({ jobId: requestId }, { status: 200 });
  } catch (err: any) {
    console.error("[IMAGE TOOLS] POST - Internal error:", err.response?.data || err.message || err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
