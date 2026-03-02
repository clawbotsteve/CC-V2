import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  if (token !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  try {
    // USER STATS (all-time)
    const usersSignedUpToday = await prismadb.user.count();

    const basicUsersToday = await prismadb.userSubscription.count({
      where: {
        status: "active",
        plan: {
          tier: "plan_basic",
        },
      },
    });

    const proUsersToday = await prismadb.userSubscription.count({
      where: {
        status: "active",
        plan: {
          tier: "plan_pro",
        },
      },
    });

    const eliteUsersToday = await prismadb.userSubscription.count({
      where: {
        status: "active",
        plan: {
          tier: "plan_elite",
        },
      },
    });

    // PURCHASE STATS (all-time)
    const loraPurchases = await prismadb.loraPurchase.count();

    // TOOL USAGE STATS (all-time)
    const imageGenerations = await prismadb.generatedImage.count();

    const videoGenerations = await prismadb.generatedVideo.count();

    const upscales = await prismadb.upscaled.count();

    const faceSwaps = await prismadb.faceSwap.count();

    const imageEdits = await prismadb.imageEdit.count();

    const imageAnalyses = await prismadb.imageAnalysis.count();

    // INFLUENCERS (all-time)
    const loraTrainings = await prismadb.influencer.count();

    return NextResponse.json({
      usersSignedUp: usersSignedUpToday,
      basicUsers: basicUsersToday,
      proUsers: proUsersToday,
      eliteUsers: eliteUsersToday,
      loraPurchases,
      imageGenerations,
      videoGenerations,
      upscales,
      faceSwaps,
      imageEdits,
      imageAnalyses,
      loraTrainings,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
