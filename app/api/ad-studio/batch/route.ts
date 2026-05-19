import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { ImageGenerationModel } from "@/types/image";
import { submitImageJob, uploadImageUrlToProvider } from "@/lib/image-provider";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";
import { AD_ANGLES, AdAngleKey, fillAdAnglePrompt } from "@/lib/ad-studio/ad-angles";
import {
  ProductTypeKey,
  detectProductType,
  productPresentation,
} from "@/lib/ad-studio/product-types";

/**
 * POST /api/ad-studio/batch — Pivot PR 3: the "fire your UGC agency" run.
 *
 * One click → the SAME real creator + real product fused across
 * multiple proven ad ANGLES (lifestyle hold, problem/solution,
 * testimonial, unboxing, before/after, demo). This is the faithful
 * path (NB2 Edit with the actual roster ref + actual product image —
 * no Seedance-2 text-model mismatch), just fanned out.
 *
 * References + product are hosted ONCE and reused across every angle
 * (don't re-upload N times). Each angle is its own GeneratedImage
 * row the existing image webhook fills in + the client polls by id —
 * identical lifecycle to the single sample, just batched.
 *
 * Body: creatorImageUrl, creatorRefs[]?, productImageUrl,
 *       productName?, creatorName?, productType?, angles?[]
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await requireTermsAccepted(userId))) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service to generate." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const creatorImageUrl: string | undefined = body?.creatorImageUrl;
    const creatorRefsRaw: string[] = Array.isArray(body?.creatorRefs)
      ? body.creatorRefs.filter(
          (u: unknown): u is string => typeof u === "string" && !!u,
        )
      : [];
    const productImageUrl: string | undefined = body?.productImageUrl;

    if (!creatorImageUrl) {
      return NextResponse.json(
        { error: "Pick or upload an AI creator first." },
        { status: 400 },
      );
    }
    if (!productImageUrl) {
      return NextResponse.json(
        { error: "Upload your product image first." },
        { status: 400 },
      );
    }

    // Which angles? A valid requested subset, else the full set of 6.
    const requested: AdAngleKey[] = Array.isArray(body?.angles)
      ? body.angles.filter((k: unknown): k is AdAngleKey =>
          AD_ANGLES.some((a) => a.key === k),
        )
      : [];
    const angles =
      requested.length > 0
        ? AD_ANGLES.filter((a) => requested.includes(a.key))
        : AD_ANGLES;

    // Product-type aware presentation (hat worn, serum applied, …).
    const productTypeKey: ProductTypeKey =
      (typeof body?.productType === "string" && body.productType) ||
      detectProductType(body?.productName);
    const presentation = productPresentation(productTypeKey);

    const variants = angles.map((angle) => ({
      angle,
      prompt: fillAdAnglePrompt(angle, {
        creator: body?.creatorName,
        product: body?.productName,
        presentation,
      }),
    }));

    // One moderation pass over all angle prompts. skipRealPerson:
    // Ad Studio names the customer's brand (celebrity classifier
    // false-positives on it) — same rationale as the other endpoints.
    const moderation = await moderateAndLog({
      userId,
      endpoint: "ad-studio.batch",
      prompt: variants.map((v) => v.prompt).join("\n---\n"),
      skipRealPerson: true,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Credit pre-flight for the WHOLE batch — don't let a user kick
    // off 6 jobs they can only afford 2 of (each job deducts on
    // completion via the webhook).
    const variantKey = "nano_banana_2_1k";
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.IMAGE_GENERATOR,
      variant: variantKey,
    });
    const perCost = creditCheck.creditCost || 1;
    const totalCost = perCost * variants.length;
    const limit = await prismadb.userApiLimit.findUnique({
      where: { userId },
      select: { availableCredit: true },
    });
    const available = limit?.availableCredit ?? 0;
    if (
      process.env.NODE_ENV !== "development" &&
      (!creditCheck.canUse || available < totalCost)
    ) {
      const affordable = Math.floor(available / perCost);
      return NextResponse.json(
        {
          error: `This batch needs ${totalCost} credits (${variants.length} variants × ${perCost}). You have ${available} — enough for ${affordable}. Top up or pick fewer angles.`,
          insufficientCredits: true,
        },
        { status: 403 },
      );
    }

    // Host creator refs + product ONCE, reuse across every angle.
    const creatorRefList = (
      creatorRefsRaw.length > 0 ? creatorRefsRaw : [creatorImageUrl]
    )
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    let hostedCreatorRefs: string[];
    let hostedProduct: string;
    try {
      const [creatorResults, prod] = await Promise.all([
        Promise.allSettled(
          creatorRefList.map((u) => uploadImageUrlToProvider(u)),
        ),
        uploadImageUrlToProvider(productImageUrl),
      ]);
      hostedCreatorRefs = creatorResults
        .filter(
          (r): r is PromiseFulfilledResult<string> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
      hostedProduct = prod;
    } catch (err) {
      console.error("[AD-STUDIO_BATCH] reference hosting failed", err);
      return NextResponse.json(
        { error: "Couldn't process the images. Re-upload and try again." },
        { status: 502 },
      );
    }
    if (hostedCreatorRefs.length === 0) {
      return NextResponse.json(
        {
          error:
            "Couldn't load the creator image. Pick another creator or upload a photo.",
        },
        { status: 502 },
      );
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image");
    const imageUrls = [...hostedCreatorRefs, hostedProduct];

    // Fan out one NB2 job per angle. Settle all — partial success is
    // fine (the client just shows whatever started).
    const results = await Promise.allSettled(
      variants.map(async ({ angle, prompt }) => {
        const resp = await submitImageJob(ImageGenerationModel.NanoBanana2, {
          input: {
            prompt,
            num_images: 1,
            output_format: "png",
            output_resolution: "2K",
            resolution: "2K",
            aspect_ratio: angle.aspectRatio,
            aspectRatio: angle.aspectRatio,
            image_urls: imageUrls,
          },
          webhookUrl,
        });
        if (!resp?.request_id) throw new Error("no request_id");
        await prismadb.generatedImage.create({
          data: {
            id: resp.request_id,
            userId,
            imageUrl: "",
            prompt,
            variant: "sfw",
            creditVariant: variantKey,
            contentType: "sfw",
            nsfwFlag: false,
            status: "queued",
          },
        });
        return {
          jobId: resp.request_id,
          angle: angle.key,
          label: angle.label,
          aspectRatio: angle.aspectRatio,
        };
      }),
    );

    const jobs = results.flatMap((r) =>
      r.status === "fulfilled" ? [r.value] : [],
    );

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: "Batch failed to start. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ jobs, requested: variants.length });
  } catch (err: any) {
    console.error("[AD-STUDIO_BATCH]", err?.message || err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
