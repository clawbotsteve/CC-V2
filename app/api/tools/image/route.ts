import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { startOfDay } from "date-fns";
import { ImageGenerationInput, ImageGenerationModel, LoraInput, NanoBannaProInput, NanoBanana2Input, Soul2Input, V1Input } from "@/types/image";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { getFalJobResult, submitFalJob, uploadImageUrlToFalStorage } from "@/lib/fal-client";
import { aspectToImageSize, imageSizeToAspect, normalizeAspect } from "@/lib/aspect-ratio";
import { canUseImageModel, requiredPlanForImageModel, resolveAccessTier } from "@/lib/plan-access";
import { PLATFORM_SAFETY_NEGATIVE_PROMPT } from "@/constants/constants";
import { moderateAndLog } from "@/lib/content-moderation";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";

function getImageCreditVariant(input: ImageGenerationInput): string {
  if (input.model === ImageGenerationModel.GptImage2) {
    const q = input.quality ?? "medium";
    return `gpt_image_2_${q}`;
  }
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
          ImageGenerationModel.GptImage2,
          ImageGenerationModel.NanoBanana2,
          ImageGenerationModel.NanoBanana2Base,
          ImageGenerationModel.NanoBannaPro,
          ImageGenerationModel.Lora,
          ImageGenerationModel.V1,
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

    // Defense in depth: the frontend modal also gates this, but stale
    // tokens or direct API hits could bypass it. Mirrors the pattern
    // we'll apply to /api/tools/video and other generation routes.
    if (!(await requireTermsAccepted(userId))) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service to generate." },
        { status: 403 }
      );
    }

    const today = startOfDay(new Date());
    const data: ImageGenerationInput = await req.json();

    // Safety fallback: production requests without explicit model should default
    // to gpt-image-2 (the entry-level model available on Beginner+).
    if (!data.model) {
      data.model = ImageGenerationModel.GptImage2;
    }

    if (data.prompt) {
      const moderation = await moderateAndLog({
        userId,
        endpoint: "tools.image",
        prompt: data.prompt,
      });
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 });
      }
    }

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

    // Quality enforcement for gpt-image-2:
    //   - Free + Beginner are locked to "medium". Beginner pays $9.99 for
    //     all 4 models, but the entry-tier price floor needs the high
    //     quality lever available to Starter+ to make the upgrade worth it.
    //   - Starter+ can pick low / medium / high.
    if (data.model === ImageGenerationModel.GptImage2) {
      const requested = (data.quality ?? "medium");
      const isLockedToMedium = access === "free" || access === "beginner";
      body.quality = isLockedToMedium ? "medium" : requested;
    }

    // Resolution cap for Beginner on the Nano Banana family. Beginner can
    // request 1K / 2K but NOT 4K; Starter+ has no cap. Same justification
    // as above — preserving an upgrade lever for Starter at $19.99.
    const isNanoFamily =
      data.model === ImageGenerationModel.NanoBanana2 ||
      data.model === ImageGenerationModel.NanoBanana2Base ||
      data.model === ImageGenerationModel.NanoBannaPro;
    if (isNanoFamily && access === "beginner" && body.output_resolution === "4k") {
      body.output_resolution = "2k";
    }

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



    const webhookUrl = getWebhookUrl("/api/webhook/image");
    let requestId: string | undefined;

    if (data.model === ImageGenerationModel.GptImage2) {
      const normalizedAspect = normalizeAspect(body.aspect_ratio as any) || imageSizeToAspect(body.image_size as any);
      const normalizedImageSize = normalizedAspect ? aspectToImageSize(normalizedAspect) : undefined;

      const resp = await submitFalJob(ImageGenerationModel.GptImage2, {
        input: {
          prompt: body.prompt,
          // body.quality has already been normalized + Free-tier-clamped above.
          quality: body.quality ?? "medium",
          num_images: body.num_images || 1,
          output_format: body.output_format || "png",
          ...(normalizedAspect ? { aspect_ratio: normalizedAspect } : {}),
          ...(normalizedImageSize ? { image_size: normalizedImageSize } : {}),
          ...(body.seed !== undefined ? { seed: body.seed } : {}),
        },
        webhookUrl,
      });

      requestId = resp?.request_id;
    } else if (data.model === ImageGenerationModel.NanoBannaPro || data.model === ImageGenerationModel.NanoBanana2Base) {
      const normalizedAspect = normalizeAspect(body.aspect_ratio as any) || imageSizeToAspect(body.image_size as any);
      if (!normalizedAspect) {
        return NextResponse.json({ error: "Aspect ratio is required for Nano Banana 2." }, { status: 400 });
      }
      const normalizedImageSize = aspectToImageSize(normalizedAspect);
      const normalizedResolution =
        body.output_resolution === "4k"
          ? "4K"
          : body.output_resolution === "2k"
            ? "2K"
            : body.output_resolution === "1k"
              ? "1K"
              : undefined;

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

      const resp = await submitFalJob(ImageGenerationModel.NanoBannaPro, {
        input: {
          prompt: data_ai.prompt,
          seed: data_ai.seed,
          num_images: data_ai.num_images || 1,
          output_format: data_ai.output_format || "png",
          output_resolution: normalizedResolution,
          resolution: normalizedResolution,
          aspect_ratio: normalizedAspect,
          aspectRatio: normalizedAspect,
          image_size: normalizedImageSize,
          imageSize: normalizedImageSize,
        },
        webhookUrl,
      });

      requestId = resp?.request_id;
    } else if (data.model === ImageGenerationModel.NanoBanana2) {
      const inputImages = body.image_urls?.filter(Boolean) ?? (body.image_url ? [body.image_url] : []);
      if (inputImages.length === 0) {
        return NextResponse.json({ error: "Nano Banana 2 requires at least 1 input photo." }, { status: 400 });
      }

      const normalizedAspect = normalizeAspect(body.aspect_ratio as any) || imageSizeToAspect(body.image_size as any);
      if (!normalizedAspect) {
        return NextResponse.json({ error: "Aspect ratio is required for Nano Banana 2 Edit." }, { status: 400 });
      }
      const normalizedImageSize = aspectToImageSize(normalizedAspect);
      const normalizedResolution =
        body.output_resolution === "4k"
          ? "4K"
          : body.output_resolution === "2k"
            ? "2K"
            : body.output_resolution === "1k"
              ? "1K"
              : undefined;

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

      const falHostedImageUrls = await Promise.all(
        (data_ai.image_urls ?? []).map(async (url) => uploadImageUrlToFalStorage(url))
      );

      const resp = await submitFalJob(ImageGenerationModel.NanoBanana2, {
        input: {
          prompt: data_ai.prompt,
          seed: data_ai.seed,
          num_images: data_ai.num_images || 1,
          output_format: data_ai.output_format || "png",
          output_resolution: normalizedResolution,
          resolution: normalizedResolution,
          aspect_ratio: normalizedAspect,
          aspectRatio: normalizedAspect,
          image_size: normalizedImageSize,
          imageSize: normalizedImageSize,
          image_urls: falHostedImageUrls,
        },
        webhookUrl,
      });

      requestId = resp?.request_id;
    } else if (data.model === ImageGenerationModel.Soul2) {
      // Soul Reference (Higgsfield) is text + reference-image → image.
      // Auth format per docs (https://docs.higgsfield.ai/how-to/introduction):
      //   Authorization: Key {api_key_id}:{api_key_secret}
      // Operators store the combined "id:secret" string in HIGGSFIELD_API_KEY.
      const apiKey = process.env.HIGGSFIELD_API_KEY;
      const baseUrl = (process.env.HIGGSFIELD_BASE_URL || "https://platform.higgsfield.ai").replace(/\/$/, "");

      if (!apiKey) {
        return NextResponse.json({ error: "Missing HIGGSFIELD_API_KEY" }, { status: 500 });
      }

      // Soul Reference requires an input image AS AN ABSOLUTE PUBLIC URL —
      // Higgsfield 422s on relative paths ("/uploads/..."). Mirror what
      // Nano Banana 2 Edit does: hand-off the user's upload to FAL storage,
      // which gives us a publicly fetchable URL Higgsfield can resolve.
      const localReferenceUrl = body.image_url || body.image_urls?.[0];
      if (!localReferenceUrl) {
        return NextResponse.json(
          { error: "Soul 2.0 requires a reference image. Upload one and try again." },
          { status: 400 }
        );
      }

      let referenceImageUrl: string;
      try {
        referenceImageUrl = await uploadImageUrlToFalStorage(localReferenceUrl);
      } catch (err) {
        console.error("[SOUL2] Failed to host reference on FAL:", localReferenceUrl, err);
        return NextResponse.json(
          { error: "Failed to process reference image. Re-upload and try again." },
          { status: 400 }
        );
      }

      // Map our internal aspect_ratio to Higgsfield's accepted enum. Their
      // docs allow: 9:16, 16:9, 4:3, 3:4, 1:1, 2:3, 3:2 (default 4:3).
      const allowedAspect = new Set(["9:16", "16:9", "4:3", "3:4", "1:1", "2:3", "3:2"]);
      const aspect = body.aspect_ratio && allowedAspect.has(String(body.aspect_ratio))
        ? String(body.aspect_ratio)
        : "4:3";

      // Higgsfield rejects seed > 1,000,000 (422 less_than_equal). Our form
      // generates seeds in the 1M-10M range, so we mod-clamp into a valid
      // range. Drop seed entirely if for some reason it's missing or zero.
      const safeSeed =
        body.seed && body.seed > 0
          ? Math.floor(body.seed % 1_000_000)
          : undefined;

      const payload = {
        prompt: body.prompt,
        image_reference_url: referenceImageUrl,
        aspect_ratio: aspect,
        resolution: "720p",
        batch_size: Math.min(Math.max(body.num_images ?? 1, 1), 4),
        enhance_prompt: true,
        style_strength: 1,
        ...(safeSeed !== undefined ? { seed: safeSeed } : {}),
      };

      const response = await fetch(`${baseUrl}/higgsfield-ai/soul/reference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("[SOUL2] submit failed", response.status, json);
        return NextResponse.json(
          { error: json?.detail || json?.error || `Soul 2.0 request failed (${response.status})` },
          { status: response.status }
        );
      }

      requestId = json?.request_id;
      if (!requestId) {
        return NextResponse.json({ error: "Missing request id from Soul 2.0 response", details: json }, { status: 500 });
      }
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

      const resp = await submitFalJob(ImageGenerationModel.Lora, {
        input: {
          enable_safety_checker: data_ai.enable_safety_checker,
          guidance_scale: data_ai.guidance_scale,
          image_size: data_ai.image_size,
          loras: data_ai.loras,
          num_images: data_ai.num_images,
          num_inference_steps: data_ai.num_inference_steps,
          output_format: data_ai.output_format,
          prompt: data_ai.prompt,
          seed: data_ai.seed,
        },
        webhookUrl,
      });

      requestId = resp?.request_id;
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

      const resp = await submitFalJob(ImageGenerationModel.V1, {
        input: {
          prompt: data_ai.prompt,
          image_size: data_ai.image_size,
          seed: data_ai.seed,
          num_images: data_ai.num_images,
          enable_safety_checker: data_ai.enable_safety_checker,
          safety_tolerance: data_ai.enable_safety_checker ? data_ai.safety_tolerance : "6",
          output_format: data_ai.output_format,
        },
        webhookUrl,
      });

      requestId = resp?.request_id;
    }

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
          // variant is the content classification (sfw/nsfw enum).
          variant: isNSFW ? "nsfw" : "sfw",
          // creditVariant is the credit-cost lookup key
          // (e.g. "gpt_image_2_medium", "nano_banana_2_1k", "sfw").
          // The webhook reads this back to deduct the right number of credits.
          // Previously the webhook had no way to look up the per-quality cost,
          // so high-quality gpt-image-2 jobs were under-charged or not
          // charged at all.
          creditVariant: getImageCreditVariant(data),
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
