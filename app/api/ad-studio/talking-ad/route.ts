import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getWebhookUrl } from "@/lib/utils";
import { submitImageJob } from "@/lib/image-provider";
import { moderateAndLog } from "@/lib/content-moderation";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";
import { resolveAccessTier } from "@/lib/plan-access";
import { getStockCreator, buildTalkingHookPrompt } from "@/lib/ad-studio/stock-creators";

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

    const creator = creatorId ? getStockCreator(creatorId) : undefined;
    if (!creator) {
      return NextResponse.json(
        {
          error:
            "Talking video ads need a Tavira roster creator (the talking model can't use an uploaded photo). Pick one from the roster.",
        },
        { status: 400 },
      );
    }
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

    const { prompt, seed } = buildTalkingHookPrompt(creator, script);

    const moderation = await moderateAndLog({
      userId,
      endpoint: "ad-studio.talking-ad",
      prompt,
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
          duration: 5,
          resolution: "720p",
          aspect_ratio: "9:16",
          generate_audio: true,
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
        duration: 5,
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
