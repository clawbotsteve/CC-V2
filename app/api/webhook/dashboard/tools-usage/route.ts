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
    const body = await req.json().catch(() => ({}))
    const daysBack = body.daysBack ?? 30

    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    // ── 1. Total counts & credits per tool type (all time) ──
    const [
      imageCount,
      videoCount,
      upscaleCount,
      faceSwapCount,
      faceEnhanceCount,
      imageEditCount,
      imageAnalysisCount,
    ] = await Promise.all([
      prismadb.generatedImage.count(),
      prismadb.generatedVideo.count(),
      prismadb.upscaled.count(),
      prismadb.faceSwap.count(),
      prismadb.faceEnhance.count(),
      prismadb.imageEdit.count(),
      prismadb.imageAnalysis.count(),
    ])

    // ── 2. Credits spent per tool type (all time) ──
    const [
      imageCredits,
      videoCredits,
      upscaleCredits,
      faceSwapCredits,
      faceEnhanceCredits,
      imageEditCredits,
      imageAnalysisCredits,
    ] = await Promise.all([
      prismadb.generatedImage.aggregate({ _sum: { creditUsed: true } }),
      prismadb.generatedVideo.aggregate({ _sum: { creditUsed: true } }),
      prismadb.upscaled.aggregate({ _sum: { creditUsed: true } }),
      prismadb.faceSwap.aggregate({ _sum: { creditUsed: true } }),
      prismadb.faceEnhance.aggregate({ _sum: { creditUsed: true } }),
      prismadb.imageEdit.aggregate({ _sum: { creditUsed: true } }),
      prismadb.imageAnalysis.aggregate({ _sum: { creditUsed: true } }),
    ])

    // ── 3. Counts in the selected period ──
    const periodFilter = { createdAt: { gte: since } }
    const [
      imagePeriod,
      videoPeriod,
      upscalePeriod,
      faceSwapPeriod,
      faceEnhancePeriod,
      imageEditPeriod,
      imageAnalysisPeriod,
    ] = await Promise.all([
      prismadb.generatedImage.count({ where: periodFilter }),
      prismadb.generatedVideo.count({ where: periodFilter }),
      prismadb.upscaled.count({ where: periodFilter }),
      prismadb.faceSwap.count({ where: periodFilter }),
      prismadb.faceEnhance.count({ where: periodFilter }),
      prismadb.imageEdit.count({ where: periodFilter }),
      prismadb.imageAnalysis.count({ where: periodFilter }),
    ])

    // ── 4. Video breakdown by model ──
    const videosByModel = await prismadb.generatedVideo.groupBy({
      by: ['model'],
      _count: { id: true },
      _sum: { creditUsed: true },
    })

    const videosByModelPeriod = await prismadb.generatedVideo.groupBy({
      by: ['model'],
      where: periodFilter,
      _count: { id: true },
      _sum: { creditUsed: true },
    })

    // ── 5. Success/failure rates per tool ──
    const [
      imageStatuses,
      videoStatuses,
      upscaleStatuses,
      faceSwapStatuses,
      faceEnhanceStatuses,
      imageEditStatuses,
      imageAnalysisStatuses,
    ] = await Promise.all([
      prismadb.generatedImage.groupBy({ by: ['status'], _count: { id: true } }),
      prismadb.generatedVideo.groupBy({ by: ['status'], _count: { id: true } }),
      prismadb.upscaled.groupBy({ by: ['status'], _count: { id: true } }),
      prismadb.faceSwap.groupBy({ by: ['status'], _count: { id: true } }),
      prismadb.faceEnhance.groupBy({ by: ['status'], _count: { id: true } }),
      prismadb.imageEdit.groupBy({ by: ['status'], _count: { id: true } }),
      prismadb.imageAnalysis.groupBy({ by: ['status'], _count: { id: true } }),
    ])

    // ── 6. Daily trend data for the period ──
    const [
      imageTrend,
      videoTrend,
      upscaleTrend,
      faceSwapTrend,
      faceEnhanceTrend,
      imageEditTrend,
      imageAnalysisTrend,
    ] = await Promise.all([
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "GeneratedImage" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
        since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "GeneratedVideo" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
        since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "Upscaled" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
        since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "FaceSwap" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
        since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "FaceEnhance" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
        since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "ImageEdit" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
        since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "ImageAnalysis" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
        since
      ),
    ])

    // ── 7. Video daily trend by model ──
    const videoTrendByModel = await prismadb.$queryRawUnsafe<
      { date: string; model: string; count: number }[]
    >(
      `SELECT DATE("createdAt") as date, model, COUNT(*)::int as count FROM "GeneratedVideo" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt"), model ORDER BY date`,
      since
    )

    // ── 8. Tool credit costs (configuration) ──
    const toolCreditCosts = await prismadb.toolCreditCost.findMany({
      include: { tier: { select: { name: true, tier: true } } },
      orderBy: [{ tool: 'asc' }, { variant: 'asc' }],
    })

    // ── 9. Top users per tool (top 5 by generation count) ──
    const [topImageUsers, topVideoUsers] = await Promise.all([
      prismadb.$queryRawUnsafe<{ userId: string; count: number }[]>(
        `SELECT "userId", COUNT(*)::int as count FROM "GeneratedImage" GROUP BY "userId" ORDER BY count DESC LIMIT 5`
      ),
      prismadb.$queryRawUnsafe<{ userId: string; count: number }[]>(
        `SELECT "userId", COUNT(*)::int as count FROM "GeneratedVideo" GROUP BY "userId" ORDER BY count DESC LIMIT 5`
      ),
    ])

    // ── Build response ──
    const formatStatuses = (statuses: { status: string; _count: { id: number } }[]) =>
      Object.fromEntries(statuses.map((s) => [s.status, s._count.id]))

    const VIDEO_MODEL_LABELS: Record<string, string> = {
      kling: 'Kling 2.6',
      'kling-motion-control': 'Kling Motion Control',
      bytedance: 'Bytedance',
      veo: 'Veo 3.1',
      wan: 'Wan 720p',
      '': 'Unknown',
    }

    return NextResponse.json({
      summary: {
        totalGenerations:
          imageCount + videoCount + upscaleCount + faceSwapCount + faceEnhanceCount + imageEditCount + imageAnalysisCount,
        totalCreditsSpent:
          (imageCredits._sum.creditUsed ?? 0) +
          (videoCredits._sum.creditUsed ?? 0) +
          (upscaleCredits._sum.creditUsed ?? 0) +
          (faceSwapCredits._sum.creditUsed ?? 0) +
          (faceEnhanceCredits._sum.creditUsed ?? 0) +
          (imageEditCredits._sum.creditUsed ?? 0) +
          (imageAnalysisCredits._sum.creditUsed ?? 0),
        periodGenerations:
          imagePeriod + videoPeriod + upscalePeriod + faceSwapPeriod + faceEnhancePeriod + imageEditPeriod + imageAnalysisPeriod,
      },
      tools: [
        {
          name: 'Image Generation',
          type: 'IMAGE_GENERATOR',
          totalCount: imageCount,
          periodCount: imagePeriod,
          creditsSpent: imageCredits._sum.creditUsed ?? 0,
          statuses: formatStatuses(imageStatuses as any),
        },
        {
          name: 'Video Generation',
          type: 'VIDEO_GENERATOR',
          totalCount: videoCount,
          periodCount: videoPeriod,
          creditsSpent: videoCredits._sum.creditUsed ?? 0,
          statuses: formatStatuses(videoStatuses as any),
          models: videosByModel.map((v) => ({
            model: v.model,
            label: VIDEO_MODEL_LABELS[v.model] || v.model,
            count: v._count.id,
            creditsSpent: v._sum.creditUsed ?? 0,
          })),
          modelsPeriod: videosByModelPeriod.map((v) => ({
            model: v.model,
            label: VIDEO_MODEL_LABELS[v.model] || v.model,
            count: v._count.id,
            creditsSpent: v._sum.creditUsed ?? 0,
          })),
        },
        {
          name: 'Image Upscale',
          type: 'IMAGE_UPSCALER',
          totalCount: upscaleCount,
          periodCount: upscalePeriod,
          creditsSpent: upscaleCredits._sum.creditUsed ?? 0,
          statuses: formatStatuses(upscaleStatuses as any),
        },
        {
          name: 'Face Swap',
          type: 'FACE_SWAP',
          totalCount: faceSwapCount,
          periodCount: faceSwapPeriod,
          creditsSpent: faceSwapCredits._sum.creditUsed ?? 0,
          statuses: formatStatuses(faceSwapStatuses as any),
        },
        {
          name: 'Face Enhance',
          type: 'FACE_ENHANCE',
          totalCount: faceEnhanceCount,
          periodCount: faceEnhancePeriod,
          creditsSpent: faceEnhanceCredits._sum.creditUsed ?? 0,
          statuses: formatStatuses(faceEnhanceStatuses as any),
        },
        {
          name: 'Image Edit',
          type: 'IMAGE_EDITOR',
          totalCount: imageEditCount,
          periodCount: imageEditPeriod,
          creditsSpent: imageEditCredits._sum.creditUsed ?? 0,
          statuses: formatStatuses(imageEditStatuses as any),
        },
        {
          name: 'Image Analysis',
          type: 'IMAGE_ANALYSIS',
          totalCount: imageAnalysisCount,
          periodCount: imageAnalysisPeriod,
          creditsSpent: imageAnalysisCredits._sum.creditUsed ?? 0,
          statuses: formatStatuses(imageAnalysisStatuses as any),
        },
      ],
      trends: {
        image: imageTrend,
        video: videoTrend,
        upscale: upscaleTrend,
        faceSwap: faceSwapTrend,
        faceEnhance: faceEnhanceTrend,
        imageEdit: imageEditTrend,
        imageAnalysis: imageAnalysisTrend,
        videoByModel: videoTrendByModel,
      },
      creditCosts: toolCreditCosts.map((tc) => ({
        id: tc.id,
        tool: tc.tool,
        variant: tc.variant,
        creditCost: tc.creditCost,
        planTier: tc.tier.tier,
        planName: tc.tier.name,
      })),
      topUsers: {
        image: topImageUsers,
        video: topVideoUsers,
      },
      daysBack,
    })
  } catch (error) {
    console.error('[DASHBOARD_TOOLS_USAGE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to load tools usage data' }, { status: 500 })
  }
}
