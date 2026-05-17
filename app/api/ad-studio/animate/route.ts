import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { submitImageJob, uploadImageUrlToProvider } from "@/lib/image-provider";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";

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
    const prompt: string =
      (typeof body?.prompt === "string" && body.prompt.trim()) ||
      "Subtle natural UGC motion: the person talks to the camera with relaxed micro-expressions and small natural gestures, gentle handheld phone-camera movement, the product stays clearly visible and in frame. Authentic, not over-animated.";

    const moderation = await moderateAndLog({
      userId,
      endpoint: "ad-studio.animate",
      prompt,
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

    // Re-host the still with the active provider so the i2v model
    // worker can fetch it.
    let hostedStill: string;
    try {
      hostedStill = await uploadImageUrlToProvider(imageUrl);
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
