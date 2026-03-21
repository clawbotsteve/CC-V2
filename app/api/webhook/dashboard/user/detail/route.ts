import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (authHeader.substring(7) !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch all user data in parallel
    const [user, subscription, apiLimit, generationCounts, recentImages, recentVideos, influencers, transactions] =
      await Promise.all([
        prismadb.user.findUnique({ where: { userId } }),
        prismadb.userSubscription.findUnique({
          where: { userId },
          include: { plan: true },
        }),
        prismadb.userApiLimit.findUnique({ where: { userId } }),
        // Generation counts by type
        Promise.all([
          prismadb.generatedImage.count({ where: { userId } }),
          prismadb.generatedVideo.count({ where: { userId } }),
          prismadb.upscaled.count({ where: { userId } }),
          prismadb.faceSwap.count({ where: { userId } }),
          prismadb.faceEnhance.count({ where: { userId } }),
          prismadb.imageEdit.count({ where: { userId } }),
          prismadb.imageAnalysis.count({ where: { userId } }),
        ]),
        // Recent images (last 10)
        prismadb.generatedImage.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            imageUrl: true,
            prompt: true,
            status: true,
            variant: true,
            creditUsed: true,
            createdAt: true,
          },
        }),
        // Recent videos (last 10)
        prismadb.generatedVideo.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            videoUrl: true,
            prompt: true,
            model: true,
            status: true,
            variant: true,
            creditUsed: true,
            createdAt: true,
          },
        }),
        // User's influencers/avatars
        prismadb.influencer.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            status: true,
            avatarImageUrl: true,
            isActive: true,
            createdAt: true,
          },
        }),
        // Recent transactions
        prismadb.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [images, videos, upscales, faceSwaps, faceEnhances, imageEdits, imageAnalyses] = generationCounts

    // Total credits spent across all generation types
    const totalCreditsSpent = apiLimit?.creditUsed ?? 0

    return NextResponse.json({
      user: {
        ...user,
        subscription: subscription
          ? {
              planTier: subscription.plan.tier,
              planName: subscription.plan.name,
              price: subscription.plan.price,
              period: subscription.plan.period,
              creditsPerMonth: subscription.plan.creditsPerMonth,
              maxAvatarCount: subscription.plan.maxAvatarCount,
              status: subscription.status,
              currentPeriodEnd: subscription.phyziroCurrentPeriodEnd,
              phyziroSubscriptionId: subscription.phyziroSubscriptionId,
            }
          : null,
        credits: apiLimit
          ? {
              available: apiLimit.availableCredit,
              used: apiLimit.creditUsed,
              monthlyRemaining: apiLimit.monthlyRemainingCredits,
              avatarSlots: apiLimit.availableAvatarSlot,
              avatarSlotsUsed: apiLimit.avatarSlotUsed,
            }
          : null,
      },
      generationCounts: {
        images,
        videos,
        upscales,
        faceSwaps,
        faceEnhances,
        imageEdits,
        imageAnalyses,
        total: images + videos + upscales + faceSwaps + faceEnhances + imageEdits + imageAnalyses,
      },
      totalCreditsSpent,
      recentImages,
      recentVideos,
      influencers,
      transactions,
    })
  } catch (error) {
    console.error('[DASHBOARD_USER_DETAIL_ERROR]', error)
    return NextResponse.json({ error: 'Failed to load user detail' }, { status: 500 })
  }
}
