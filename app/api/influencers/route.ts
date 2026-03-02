import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { absoluteUrl } from '@/lib/utils';
import axios from 'axios';
import { auth } from '@clerk/nextjs/server';
import { PLAN_FREE, PLAN_CREATOR, PLAN_STUDIO } from '@/constants';
import { isUserAdmin } from '../user/info/_lib/check-if-admin';
import { InfluencerJobInput } from '@/types/influencer';
import { InfluencerWithOwner } from '@/types/types';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Influencers created by the current user (self-owned)
    // Only show active influencers (filter out soft-deleted ones)
    const ownInfluencers = await prismadb.influencer.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: { lora: true },
      orderBy: { createdAt: 'desc' },
    });

    const ownWithOwner: InfluencerWithOwner[] = ownInfluencers.map((inf) => ({
      ...inf,
      owner: "self" as const,
    }));

    // 2. Influencers from LoRAs the user purchased (external)
    const purchasedLoras = await prismadb.lora.findMany({
      where: {
        purchases: {
          some: { userId },
        },
      },
      select: {
        influencer: {
          include: { lora: true },
        },
      },
    });

    const purchasedInfluencers = purchasedLoras
      .map((lora) => lora.influencer)
      .filter((inf): inf is NonNullable<typeof inf> => inf !== null);

    const externalWithOwner: InfluencerWithOwner[] = purchasedInfluencers.map((inf) => ({
      ...inf,
      owner: "external" as const,
    }));

    // 3. Merge and deduplicate
    const combinedMap = new Map<string, typeof ownWithOwner[0]>();
    [...ownWithOwner, ...externalWithOwner].forEach((inf) => {
      combinedMap.set(inf.id, inf);
    });

    const allInfluencers = Array.from(combinedMap.values());

    return NextResponse.json(allInfluencers);
  } catch (error) {
    console.error("[INFLUENCER_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: InfluencerJobInput = await req.json();
    const isAdmin = await isUserAdmin(userId)

    // STEP 1: Submit finetune training job to internal API
    const trainRes = await axios.post(
      absoluteUrl("/api/ai/train"),
      {
        images_data_url: data.trainingFileUrl,
        is_style: data.mode === "style" ? true : false,
        model: data.model,
        trigger_word: data.trigger,
        steps: isAdmin ? data.step : (data.plan === PLAN_CREATOR || data.plan === PLAN_STUDIO ? 2000 : 1000),
        learning_rate: data.learningRate,
        default_caption: data.defaultCaption,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { requestId } = trainRes.data;

    if (!requestId) {
      return NextResponse.json({ error: "Finetune job failed: Missing requestId" }, { status: 500 });
    }

    // STEP 2: Store influencer in DB
    const influencer = await prismadb.influencer.create({
      data: {
        id: requestId,
        userId,
        name: data.name,
        description: data.description,
        mode: data.mode,
        step: data.step.toString(),
        avatarImageUrl: data.avatarImageurl,
        triggerWord: data.trigger,
        trainingFile: data.trainingFileUrl,
        status: "queued",
        isPublic: data.isPublic ?? false,
        contentType: data.contentType ?? "sfw",
      },
    });

    return NextResponse.json({ influencer, jobId: requestId }, { status: 200 });

  } catch (error) {
    console.error("[API_ERROR_CREATE_INFLUENCER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
