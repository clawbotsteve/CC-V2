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
 * POST /api/ad-studio/sample
 *
 * The core Ad Studio primitive (Pivot PR 2): fuse an AI creator
 * reference + a product image into ONE believable UGC ad shot.
 *
 * Reuses the proven Nano Banana 2 Edit multi-image fusion path that
 * Character Studio's variations already use — passes BOTH the creator
 * reference and the product image as image_urls, with an ad-angle
 * prompt that keeps the creator's identity consistent while
 * compositing the product naturally.
 *
 * MVP scope: 1 sample. The 20-variant batch (angles × formats ×
 * emotions) is Pivot PR 3, built on top of this exact path.
 *
 * Body:
 *   creatorImageUrl  — reference for the AI creator (a Character
 *                      Studio character's ref OR an uploaded photo)
 *   productImageUrl  — the product to feature
 *   angle            — AdAngleKey (lifestyle_hold default)
 *   productName?     — optional grounding text for the prompt
 *   creatorName?     — optional grounding text
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
    // Optional multi-reference set. When a STOCK creator is picked the
    // client sends its full premade photo set (2-3 angles). NB2 Edit
    // locks identity much harder with multiple refs than one — this
    // is why each stock creator ships with a SET, not a single shot.
    // Falls back to [creatorImageUrl] for uploads / trained creators.
    const creatorRefsRaw: string[] = Array.isArray(body?.creatorRefs)
      ? body.creatorRefs.filter((u: unknown): u is string => typeof u === "string" && !!u)
      : [];
    const productImageUrl: string | undefined = body?.productImageUrl;
    const angleKey: AdAngleKey = body?.angle || "lifestyle_hold";

    if (!creatorImageUrl) {
      return NextResponse.json({ error: "Pick or upload an AI creator first." }, { status: 400 });
    }
    if (!productImageUrl) {
      return NextResponse.json({ error: "Upload your product image first." }, { status: 400 });
    }

    const angle = AD_ANGLES.find((a) => a.key === angleKey) || AD_ANGLES[0];

    // Product-type awareness: use the explicit type the client sent,
    // else auto-detect from the product name (safe "generic" fallback
    // = the old hold-to-camera behaviour). This is what makes a hat
    // get WORN and a serum APPLIED instead of every product being
    // held flat to the chest like a catalog shot.
    const productTypeKey: ProductTypeKey =
      (typeof body?.productType === "string" && body.productType) ||
      detectProductType(body?.productName);
    const presentation = productPresentation(productTypeKey);

    const prompt = fillAdAnglePrompt(angle, {
      creator: body?.creatorName,
      product: body?.productName,
      presentation,
    });

    // Moderation — same pipeline every gen endpoint uses.
    const moderation = await moderateAndLog({
      userId,
      endpoint: "ad-studio.sample",
      prompt,
      skipRealPerson: true,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Credit pre-flight. Ad Studio uses the Nano Banana 2 Edit path,
    // priced as nano_banana_2_1k (same as Character Studio variations).
    const variantKey = "nano_banana_2_1k";
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.IMAGE_GENERATOR,
      variant: variantKey,
    });
    if (!creditCheck.canUse) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${creditCheck.creditCost}` },
        { status: 403 },
      );
    }

    // Build the creator reference list: the multi-ref set when a
    // stock creator was picked, else the single image. Dedup +
    // cap at 3 creator refs so the product still gets a clear slot
    // and we don't blow the input budget.
    const creatorRefList = (
      creatorRefsRaw.length > 0 ? creatorRefsRaw : [creatorImageUrl]
    )
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    // Re-host every reference + the product with the active provider
    // so the model worker can fetch them (FAL storage or Replicate
    // /v1/files depending on IMAGE_PROVIDER). Stock-creator refs that
    // 404 (asset not dropped in yet) are silently dropped so the
    // flow still works with whatever refs DO resolve.
    let hostedCreatorRefs: string[];
    let hostedProduct: string;
    try {
      const [creatorResults, prod] = await Promise.all([
        Promise.allSettled(creatorRefList.map((u) => uploadImageUrlToProvider(u))),
        uploadImageUrlToProvider(productImageUrl),
      ]);
      hostedCreatorRefs = creatorResults
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      hostedProduct = prod;
    } catch (err) {
      console.error("[AD-STUDIO] reference hosting failed", err);
      return NextResponse.json(
        { error: "Couldn't process the images. Re-upload and try again." },
        { status: 502 },
      );
    }

    if (hostedCreatorRefs.length === 0) {
      return NextResponse.json(
        { error: "Couldn't load the creator image. Pick another creator or upload a photo." },
        { status: 502 },
      );
    }

    const webhookUrl = getWebhookUrl("/api/webhook/image");

    const resp = await submitImageJob(ImageGenerationModel.NanoBanana2, {
      input: {
        prompt,
        num_images: 1,
        output_format: "png",
        output_resolution: "1K",
        resolution: "1K",
        aspect_ratio: angle.aspectRatio,
        aspectRatio: angle.aspectRatio,
        // Creator reference(s) lead, product last. NB2 Edit treats
        // array order as semantically meaningful and the angle prompt
        // references "image 1" (the creator) + the final product image.
        // Multiple leading creator refs = much harder identity lock.
        image_urls: [...hostedCreatorRefs, hostedProduct],
      },
      webhookUrl,
    });

    if (!resp?.request_id) {
      return NextResponse.json(
        { error: "Generation failed to start. Please try again." },
        { status: 502 },
      );
    }

    // Same GeneratedImage-row pattern as Character Studio variations:
    // the webhook fills in imageUrl + deducts credits once the model
    // finishes. The client polls the row by id.
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

    return NextResponse.json({
      jobId: resp.request_id,
      angle: angle.key,
      aspectRatio: angle.aspectRatio,
    });
  } catch (err: any) {
    console.error("[AD-STUDIO_SAMPLE]", err?.message || err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
