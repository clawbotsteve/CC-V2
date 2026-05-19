import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { submitImageJob, uploadImageUrlToProvider } from "@/lib/image-provider";
import { uploadBlobToReplicate } from "@/lib/replicate-client";
import { cropBufferTo916 } from "@/lib/ad-studio/crop916";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";
import { buildSeedanceMotionPrompt } from "@/lib/ad-studio/product-types";

/**
 * POST /api/ad-studio/animate
 *
 * Step 2 of the Ad Studio flow: take the still UGC ad we just
 * generated and animate it into a short UGC VIDEO ad via Seedance
 * image-to-video (Replicate bytedance/seedance-1-pro).
 *
 * Deliberately a SEPARATE one-click step (not auto-chained off the
 * still): a Seedance clip costs ~38 credits vs ~1 for the still and
 * takes ~90s. Generating the cheap still first, letting the user
 * approve/re-roll it, THEN committing to the expensive video =
 * same "don't make me think" flow but credit-respectful and the
 * user ships the video they actually like.
 *
 * Body:
 *   imageUrl  — the generated still ad (the i2v first frame)
 *   prompt?   — optional motion direction; sensible UGC default
 *
 * Reuses the existing video webhook (/api/webhook/replicate/video
 * when IMAGE_PROVIDER=replicate) + GeneratedVideo row pattern, so
 * the client can poll /api/tools/video/status/[jobId].
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
    const imageUrl: string | undefined = body?.imageUrl;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No still to animate. Generate the ad image first." },
        { status: 400 },
      );
    }

    // Natural UGC motion default — subtle, talking-to-camera energy.
    // The still already nails the composition; we just want it to
    // feel alive, not over-animated.
    // Structured, product-type-aware Seedance motion prompt (Higgsfield-
    // style layering: shot spec + action beat + realism). Falls back
    // to "generic" when no type is sent. An explicit prompt still wins.
    const prompt: string =
      (typeof body?.prompt === "string" && body.prompt.trim()) ||
      buildSeedanceMotionPrompt(body?.productType);

    const moderation = await moderateAndLog({
      userId,
      endpoint: "ad-studio.animate",
      prompt,
      skipRealPerson: true,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Seedance i2v, 5s, priced as seedance_v2_ref_5s (seeded across
    // all tiers). Pre-flight the credit check so the user isn't
    // surprised mid-flow.
    const variantKey = "seedance_v2_ref_5s";
    const creditCheck = await checkAvailableCredit({
      userId,
      tool: ToolType.VIDEO_GENERATOR,
      variant: variantKey,
    });
    if (!creditCheck.canUse) {
      return NextResponse.json(
        {
          error: `Video ads need ${creditCheck.creditCost} credits. Top up or upgrade to keep going.`,
          insufficientCredits: true,
        },
        { status: 403 },
      );
    }

    // Center-crop the still to true 9:16 first (GPT Image 2 stills
    // are 2:3) so the video is vertical, then re-host for the i2v
    // worker. Crop is best-effort — on any failure fall back to the
    // raw still so the user still gets a video.
    let hostedStill: string;
    try {
      let stillBuf: Buffer | null = null;
      try {
        const r = await fetch(imageUrl);
        if (r.ok) {
          stillBuf = await cropBufferTo916(Buffer.from(await r.arrayBuffer()));
        }
      } catch (cropErr) {
        console.warn("[AD-STUDIO_ANIMATE] 9:16 crop skipped:", cropErr);
      }
      hostedStill = stillBuf
        ? await uploadBlobToReplicate(
            new Blob([new Uint8Array(stillBuf)], { type: "image/png" }),
            "still-9x16.png",
          )
        : await uploadImageUrlToProvider(imageUrl);
    } catch (err) {
      console.error("[AD-STUDIO_ANIMATE] still hosting failed", err);
      return NextResponse.json(
        { error: "Couldn't process the still. Try regenerating the ad image." },
        { status: 502 },
      );
    }

    const webhookUrl = getWebhookUrl("/api/webhook/video");

    // fal-ai/bytedance/seedance/v1/pro/fast/image-to-video maps to
    // Replicate bytedance/seedance-1-pro; the provider translator
    // turns image_url -> image, keeps duration/resolution.
    const resp = await submitImageJob(
      "fal-ai/bytedance/seedance/v1/pro/fast/image-to-video",
      {
        input: {
          prompt,
          image_url: hostedStill,
          duration: 5,
          resolution: "720p",
          aspect_ratio: "9:16",
        },
        webhookUrl,
      },
    );

    if (!resp?.request_id) {
      return NextResponse.json(
        { error: "Couldn't start the video. Please try again." },
        { status: 502 },
      );
    }

    // GeneratedVideo row the webhook fills in + the client polls via
    // /api/tools/video/status/[jobId]. Required scalar fields per the
    // schema: prompt, adherence, aspectRatio, duration, status.
    await prismadb.generatedVideo.create({
      data: {
        id: resp.request_id,
        userId,
        model: "seedance",
        videoUrl: "",
        prompt,
        adherence: 0.5,
        aspectRatio: "9:16",
        duration: 5,
        contentType: "sfw",
        creditVariant: variantKey,
        nsfwFlag: false,
        status: "queued",
      },
    });

    return NextResponse.json({ jobId: resp.request_id });
  } catch (err: any) {
    console.error("[AD-STUDIO_ANIMATE]", err?.message || err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
