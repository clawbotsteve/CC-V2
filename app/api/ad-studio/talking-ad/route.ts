import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { moderateAndLog } from "@/lib/content-moderation";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";
import { resolveAccessTier } from "@/lib/plan-access";
import {
  submitWaveSpeedI2V,
  isWaveSpeedConfigured,
} from "@/lib/wavespeed-client";
import {
  normalizeTalkingDuration,
  normalizeTalkingResolution,
  normalizeTalkingAspect,
  talkingVariant,
  talkingCredits,
} from "@/lib/ad-studio/talking-pricing";

/**
 * POST /api/ad-studio/talking-ad
 *
 * The real talking UGC ad: takes the Ad Studio fused still (the
 * user's EXACT creator holding their EXACT product, from GPT
 * Image 2) and animates IT into a talking video with native audio
 * via WaveSpeed's Seedance 2.0 image-to-video.
 *
 * Why WaveSpeed (not Replicate): Replicate's Seedance-2 deployment
 * E005-blocks any person-bearing image; WaveSpeed's allows it
 * (validated 2026-05-19 — exact creator + product + talking + audio
 * + native 9:16). FAL had this too but the account is locked.
 *
 * No webhook from WaveSpeed → we key the GeneratedVideo row on the
 * WaveSpeed task id; /api/tools/video/status/[id] reconciles by
 * polling WaveSpeed (model = "wavespeed-seedance2").
 *
 * Body:
 *   imageUrl  — the fused still (creator+product) to animate (req)
 *   script    — the spoken hook line (req, <= ~240 chars)
 *   duration? — 5 (default) | 10
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

    if (!isWaveSpeedConfigured()) {
      return NextResponse.json(
        {
          error:
            "Talking video ads aren't available right now. Use \"Turn into a video ad\" for a silent version.",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const imageUrl: string | undefined = body?.imageUrl;
    const script: string =
      typeof body?.script === "string" ? body.script.trim() : "";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Generate the ad still first, then make it talk." },
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

    const duration = normalizeTalkingDuration(body?.duration);
    const resolution = normalizeTalkingResolution(body?.resolution);
    const aspectRatio = normalizeTalkingAspect(body?.aspectRatio);

    // The still already contains the exact creator + product, so the
    // prompt only drives MOTION + the spoken line. Dialogue in double
    // quotes = Seedance audio convention. Gender-neutral.
    const safe = script.replace(/["\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 240);
    const isTryOn = body?.angle === "virtual_tryon";
    const productName: string =
      typeof body?.productName === "string"
        ? body.productName.trim().slice(0, 80)
        : "";
    const item = productName || "the item";

    let prompt: string;
    if (isTryOn) {
      // Haul → (for longer clips) try-on. The still shows her in a
      // plain base top holding the garment; animate that, and for
      // 8s+ add a second beat where she actually puts it on.
      const putOnBeat =
        duration >= 8
          ? ` Partway through she pulls ${item} on over her plain top and turns to show how it fits, posing in it.`
          : "";
      prompt =
        `The person in the image holds up ${item} and talks to the phone ` +
        "front camera with genuine excited 'get ready with me' energy, " +
        `natural handheld movement.${putOnBeat} Authentic, unpolished UGC. ` +
        `They say: "${safe}"`;
    } else {
      prompt =
        "The person in the image talks directly to the phone front camera " +
        "with genuine, warm, excited UGC energy, showing the product to the " +
        "lens, natural handheld movement and micro-expressions, authentic " +
        `and unpolished. They say: "${safe}"`;
    }

    const moderation = await moderateAndLog({
      userId,
      endpoint: "ad-studio.talking-ad",
      prompt,
      skipRealPerson: true,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Computed per-second × resolution price (single source of truth
    // in talking-pricing). Charged on completion via
    // chargeExplicitCredits; preflight just gates affordability.
    const variantKey = talkingVariant(resolution);
    const cost = talkingCredits(duration, resolution);
    const limit = await prismadb.userApiLimit.findUnique({
      where: { userId },
      select: { availableCredit: true },
    });
    if ((limit?.availableCredit ?? 0) < cost) {
      return NextResponse.json(
        {
          error: `This talking video needs ${cost} credits (you have ${limit?.availableCredit ?? 0}). Top up or pick a shorter/lower-res clip.`,
          insufficientCredits: true,
        },
        { status: 403 },
      );
    }

    let taskId: string;
    try {
      const r = await submitWaveSpeedI2V({
        image: imageUrl,
        prompt,
        duration,
        resolution,
        aspectRatio,
        generateAudio: true,
      });
      taskId = r.taskId;
    } catch (err: any) {
      console.error("[AD-STUDIO_TALKING_AD] WaveSpeed submit failed", err?.message || err);
      return NextResponse.json(
        { error: "Couldn't start the talking video. Please try again." },
        { status: 502 },
      );
    }

    await prismadb.generatedVideo.create({
      data: {
        id: taskId,
        userId,
        model: "wavespeed-seedance2",
        videoUrl: "",
        prompt,
        adherence: 0.5,
        aspectRatio,
        duration,
        contentType: "sfw",
        creditVariant: variantKey,
        nsfwFlag: false,
        status: "queued",
      },
    });

    return NextResponse.json({ jobId: taskId });
  } catch (err: any) {
    console.error("[AD-STUDIO_TALKING_AD]", err?.message || err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
