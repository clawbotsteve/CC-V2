import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { submitImageJob } from "@/lib/image-provider";
import { uploadBlobToReplicate } from "@/lib/replicate-client";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";
import { resolveAccessTier } from "@/lib/plan-access";
import {
  getStockCreator,
  buildTalkingHookPrompt,
  DEFAULT_TALKING_CREATOR,
} from "@/lib/ad-studio/stock-creators";
import {
  ProductTypeKey,
  detectProductType,
  talkingProductClause,
} from "@/lib/ad-studio/product-types";

/**
 * POST /api/ad-studio/talking-ad
 *
 * Premium "Talking video ad" — the creator speaks a hook line to
 * camera, WITH native audio, via Seedance 2.0 text-to-video.
 *
 * Why text-to-video (not image-to-video): Seedance 2.0's safety
 * layer hard-blocks ANY human-likeness image input (verified E005
 * across first-frame `image` AND `reference_images`, every face,
 * prompt-independent — the deepfake gate). The only path it permits
 * for people is pure text. So the talking creator's identity comes
 * from the roster creator's persona TEXT + a locked seed → the same
 * creator renders consistently across every ad without an uploaded
 * reference. (Validated 2026-05-18: same persona+seed = same
 * creator across different scripts/products.)
 *
 * Phase 1 = the talking hook alone (genuinely useful: a talking
 * creator clip with audio). Phase 2 stitches it to a real-product
 * reveal (NB2 still → Seedance-1 motion) — deferred because
 * server-side ffmpeg concat needs Railway infra work.
 *
 * Gated to the top tier (Studio/Brand/Agency) — it's the premium
 * moat feature and Seedance 2.0 is ~10x a normal clip.
 *
 * Body:
 *   creatorId — a STOCK roster creator id (must have a persona)
 *   script    — the spoken hook line (<= ~240 chars)
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
    const creatorId: string | undefined = body?.creatorId;
    const script: string =
      typeof body?.script === "string" ? body.script.trim() : "";

    // Roster creator → its persona+seed; otherwise the default
    // persona. The talking presenter is ALWAYS generated (person
    // images E005-block), so a roster pick was never required —
    // the real product comes through via reference_images.
    const creator = (creatorId && getStockCreator(creatorId)) || DEFAULT_TALKING_CREATOR;
    if (!script) {
      return NextResponse.json(
        { error: "Add a short line for the creator to say." },
        { status: 400 },
      );
    }

    // Premium gate — Studio / Brand / Agency only.
    const subscription = await prismadb.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const access = resolveAccessTier(subscription?.plan?.tier);
    if (access !== "studio") {
      return NextResponse.json(
        {
          error:
            "Talking video ads are a Brand/Agency feature. Upgrade to generate creators that speak.",
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    const productName: string =
      typeof body?.productName === "string" ? body.productName.trim().slice(0, 90) : "";
    const productType: ProductTypeKey =
      (typeof body?.productType === "string" && body.productType) ||
      detectProductType(productName);

    // THE breakthrough (verified 2026-05-18): a PRODUCT image as a
    // Seedance-2 reference_image is NOT deepfake-blocked (only person
    // images E005). So the presenter is a text/seed persona while the
    // user's EXACT product comes through as [Image1]. The reference
    // MUST be an https URL the model worker can fetch — arbitrary
    // ecom CDN URLs (often http:// or hotlink-protected) hang the
    // job until it's canceled, so we force-mirror the bytes to a
    // Replicate file first.
    const productImageUrl: string | undefined = body?.productImageUrl;
    let productRef: string | null = null;
    if (productImageUrl) {
      try {
        const res = await fetch(productImageUrl);
        if (res.ok) {
          const blob = await res.blob();
          productRef = await uploadBlobToReplicate(blob, "product.png");
        }
      } catch (err) {
        console.error("[AD-STUDIO_TALKING_AD] product re-host failed", err);
      }
    }

    // Reference the product as [Image1] when we have a usable ref so
    // Seedance-2 renders the EXACT product; else fall back to the
    // text-only name (approximate).
    const productLabel = productRef
      ? `the ${productName || "product"} shown in [Image1]`
      : productName;
    const productClause = productLabel
      ? talkingProductClause(productType, productLabel)
      : undefined;

    // Duration: Seedance 2.0 supports 5s or 10s. Default 5.
    const duration = body?.duration === 10 || body?.duration === "10" ? 10 : 5;

    const { prompt, seed } = buildTalkingHookPrompt(creator, {
      script,
      productClause,
    });

    const moderation = await moderateAndLog({
      userId,
      endpoint: "ad-studio.talking-ad",
      prompt,
      // Ad copy names the customer's brand/product — the celebrity
      // classifier false-positives on it ("Reps FUTR" → realperson).
      skipRealPerson: true,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Priced as a Seedance video clip. NOTE: reuses the existing
    // seedance_v2_ref_5s variant as a stand-in — Seedance 2.0 is
    // pricier than Seedance-1, a dedicated credit variant is a
    // fast-follow before wide release.
    const variantKey = "seedance_v2_ref_5s";
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.VIDEO_GENERATOR,
      variant: variantKey,
    });
    if (!creditCheck.canUse) {
      return NextResponse.json(
        {
          error: `Talking video ads need ${creditCheck.creditCost} credits. Top up or upgrade to keep going.`,
          insufficientCredits: true,
        },
        { status: 403 },
      );
    }

    const webhookUrl = getWebhookUrl("/api/webhook/video");

    const resp = await submitImageJob(
      "fal-ai/bytedance/seedance-2.0/text-to-video",
      {
        input: {
          prompt,
          seed,
          duration,
          resolution: "720p",
          aspect_ratio: "9:16",
          generate_audio: true,
          ...(productRef ? { reference_images: [productRef] } : {}),
        },
        webhookUrl,
      },
    );

    if (!resp?.request_id) {
      return NextResponse.json(
        { error: "Couldn't start the talking video. Please try again." },
        { status: 502 },
      );
    }

    await prismadb.generatedVideo.create({
      data: {
        id: resp.request_id,
        userId,
        model: "seedance2-talking",
        videoUrl: "",
        prompt,
        adherence: 0.5,
        aspectRatio: "9:16",
        duration,
        contentType: "sfw",
        creditVariant: variantKey,
        nsfwFlag: false,
        status: "queued",
      },
    });

    return NextResponse.json({ jobId: resp.request_id });
  } catch (err: any) {
    console.error("[AD-STUDIO_TALKING_AD]", err?.message || err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
