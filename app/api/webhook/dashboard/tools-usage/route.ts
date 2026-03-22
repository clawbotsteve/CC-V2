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
    const periodFilter = { createdAt: { gte: since } }

    // ── Label maps ──
    const IMAGE_MODEL_LABELS: Record<string, string> = {
      'fal-ai/nano-banana-pro': 'Nano Banana Pro',
      'fal-ai/nano-banana-2': 'Nano Banana 2',
      'fal-ai/nano-banana-2/edit': 'Nano Banana 2 Edit',
      'fal-ai/flux-lora': 'Flux LoRA',
      'fal-ai/flux-pro/v1.1': 'Flux Pro V1.1',
      'higgsfield-ai/soul/reference': 'Soul2',
    }

    const VIDEO_MODEL_LABELS: Record<string, string> = {
      kling: 'Kling 2.6',
      'kling-motion-control': 'Kling Motion Control',
      bytedance: 'Bytedance',
      veo: 'Veo 3.1',
      wan: 'Wan 720p',
    }

    const UPSCALE_MODEL_LABELS: Record<string, string> = {
      'fal-ai/topaz/upscale/image': 'Topaz Image Upscale',
      'fal-ai/seedvr/upscale/image': 'SeedVR Image Upscale',
      'fal-ai/bytedance-upscaler/upscale/video': 'Bytedance Video Upscale',
    }

    // ── 1. Aggregate totals (all time) ──
    const [
      imageCount, videoCount, upscaleCount,
      faceSwapCount, faceEnhanceCount, imageEditCount, imageAnalysisCount,
    ] = await Promise.all([
      prismadb.generatedImage.count(),
      prismadb.generatedVideo.count(),
      prismadb.upscaled.count(),
      prismadb.faceSwap.count(),
      prismadb.faceEnhance.count(),
      prismadb.imageEdit.count(),
      prismadb.imageAnalysis.count(),
    ])

    // ── 2. Credits spent (all time) ──
    const [
      imageCredits, videoCredits, upscaleCredits,
      faceSwapCredits, faceEnhanceCredits, imageEditCredits, imageAnalysisCredits,
    ] = await Promise.all([
      prismadb.generatedImage.aggregate({ _sum: { creditUsed: true } }),
      prismadb.generatedVideo.aggregate({ _sum: { creditUsed: true } }),
      prismadb.upscaled.aggregate({ _sum: { creditUsed: true } }),
      prismadb.faceSwap.aggregate({ _sum: { creditUsed: true } }),
      prismadb.faceEnhance.aggregate({ _sum: { creditUsed: true } }),
      prismadb.imageEdit.aggregate({ _sum: { creditUsed: true } }),
      prismadb.imageAnalysis.aggregate({ _sum: { creditUsed: true } }),
    ])

    // ── 3. Period counts ──
    const [
      imagePeriod, videoPeriod, upscalePeriod,
      faceSwapPeriod, faceEnhancePeriod, imageEditPeriod, imageAnalysisPeriod,
    ] = await Promise.all([
      prismadb.generatedImage.count({ where: periodFilter }),
      prismadb.generatedVideo.count({ where: periodFilter }),
      prismadb.upscaled.count({ where: periodFilter }),
      prismadb.faceSwap.count({ where: periodFilter }),
      prismadb.faceEnhance.count({ where: periodFilter }),
      prismadb.imageEdit.count({ where: periodFilter }),
      prismadb.imageAnalysis.count({ where: periodFilter }),
    ])

    // ── 4. Video breakdown by model (all time + period) ──
    const [videosByModel, videosByModelPeriod] = await Promise.all([
      prismadb.generatedVideo.groupBy({
        by: ['model'],
        _count: { id: true },
        _sum: { creditUsed: true },
      }),
      prismadb.generatedVideo.groupBy({
        by: ['model'],
        where: periodFilter,
        _count: { id: true },
        _sum: { creditUsed: true },
      }),
    ])

    // ── 5. Upscale breakdown by model (via reason JSON) ──
    const [upscaleByModel, upscaleByModelPeriod] = await Promise.all([
      prismadb.$queryRawUnsafe<{ model: string; count: number; credits: number }[]>(
        `SELECT reason->>'model' as model, COUNT(*)::int as count, COALESCE(SUM("creditUsed"), 0)::float as credits FROM "Upscaled" WHERE reason->>'model' IS NOT NULL GROUP BY reason->>'model'`
      ),
      prismadb.$queryRawUnsafe<{ model: string; count: number; credits: number }[]>(
        `SELECT reason->>'model' as model, COUNT(*)::int as count, COALESCE(SUM("creditUsed"), 0)::float as credits FROM "Upscaled" WHERE reason->>'model' IS NOT NULL AND "createdAt" >= $1 GROUP BY reason->>'model'`,
        since
      ),
    ])

    // ── 6. Daily trend data ──
    const [
      imageTrend, videoTrend, upscaleTrend,
      faceSwapTrend, faceEnhanceTrend, imageEditTrend, imageAnalysisTrend,
    ] = await Promise.all([
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "GeneratedImage" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "GeneratedVideo" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "Upscaled" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "FaceSwap" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "FaceEnhance" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "ImageEdit" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since
      ),
      prismadb.$queryRawUnsafe<{ date: string; count: number }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "ImageAnalysis" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since
      ),
    ])

    // ── 7. Video daily trend by model ──
    const videoTrendByModel = await prismadb.$queryRawUnsafe<
      { date: string; model: string; count: number }[]
    >(
      `SELECT DATE("createdAt") as date, model, COUNT(*)::int as count FROM "GeneratedVideo" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt"), model ORDER BY date`,
      since
    )

    // ── 8. Tool credit costs ──
    const toolCreditCosts = await prismadb.toolCreditCost.findMany({
      include: { tier: { select: { name: true, tier: true } } },
      orderBy: [{ tool: 'asc' }, { variant: 'asc' }],
    })

    // ── 9. Top users ──
    const [topImageUsers, topVideoUsers] = await Promise.all([
      prismadb.$queryRawUnsafe<{ userId: string; count: number }[]>(
        `SELECT "userId", COUNT(*)::int as count FROM "GeneratedImage" GROUP BY "userId" ORDER BY count DESC LIMIT 5`
      ),
      prismadb.$queryRawUnsafe<{ userId: string; count: number }[]>(
        `SELECT "userId", COUNT(*)::int as count FROM "GeneratedVideo" GROUP BY "userId" ORDER BY count DESC LIMIT 5`
      ),
    ])

    // ── Build per-model video rows ──
    const videoModelMap = new Map(videosByModel.map((v) => [v.model, v]))
    const videoModelPeriodMap = new Map(videosByModelPeriod.map((v) => [v.model, v]))

    const videoModelRows = Object.entries(VIDEO_MODEL_LABELS).map(([modelKey, label]) => {
      const all = videoModelMap.get(modelKey)
      const period = videoModelPeriodMap.get(modelKey)
      return {
        name: label,
        type: 'Video',
        modelId: modelKey,
        totalCount: all?._count?.id ?? 0,
        periodCount: period?._count?.id ?? 0,
        creditsSpent: all?._sum?.creditUsed ?? 0,
      }
    })

    // ── Build per-model upscale rows ──
    const upscaleModelMap = new Map(upscaleByModel.map((u) => [u.model, u]))
    const upscaleModelPeriodMap = new Map(upscaleByModelPeriod.map((u) => [u.model, u]))

    const upscaleModelRows = Object.entries(UPSCALE_MODEL_LABELS).map(([modelKey, label]) => {
      const all = upscaleModelMap.get(modelKey)
      const period = upscaleModelPeriodMap.get(modelKey)
      return {
        name: label,
        type: 'Upscale',
        modelId: modelKey,
        totalCount: all?.count ?? 0,
        periodCount: period?.count ?? 0,
        creditsSpent: all?.credits ?? 0,
      }
    })

    // ── Image model rows (no per-model tracking in DB, show aggregate per known model) ──
    const imageModelRows = Object.entries(IMAGE_MODEL_LABELS).map(([modelKey, label]) => ({
      name: label,
      type: 'Image',
      modelId: modelKey,
      totalCount: null as number | null, // not tracked per model
      periodCount: null as number | null,
      creditsSpent: null as number | null,
    }))

    // ── Build flat tools array with ALL individual models ──
    const tools = [
      // Image models (individual — counts are null since DB doesn't track per model)
      ...imageModelRows,
      // Image generation aggregate row
      {
        name: 'All Image Models (aggregate)',
        type: 'Image',
        modelId: '_aggregate',
        totalCount: imageCount,
        periodCount: imagePeriod,
        creditsSpent: imageCredits._sum.creditUsed ?? 0,
      },
      // Video models (individual with real per-model data)
      ...videoModelRows,
      // Upscale models (individual with real per-model data)
      ...upscaleModelRows,
      // Other tools
      {
        name: 'Face Swap',
        type: 'Tool',
        modelId: 'face-swap',
        totalCount: faceSwapCount,
        periodCount: faceSwapPeriod,
        creditsSpent: faceSwapCredits._sum.creditUsed ?? 0,
      },
      {
        name: 'Face Enhance',
        type: 'Tool',
        modelId: 'face-enhance',
        totalCount: faceEnhanceCount,
        periodCount: faceEnhancePeriod,
        creditsSpent: faceEnhanceCredits._sum.creditUsed ?? 0,
      },
      {
        name: 'Image Edit',
        type: 'Tool',
        modelId: 'image-edit',
        totalCount: imageEditCount,
        periodCount: imageEditPeriod,
        creditsSpent: imageEditCredits._sum.creditUsed ?? 0,
      },
      {
        name: 'Image Analysis',
        type: 'Tool',
        modelId: 'image-analysis',
        totalCount: imageAnalysisCount,
        periodCount: imageAnalysisPeriod,
        creditsSpent: imageAnalysisCredits._sum.creditUsed ?? 0,
      },
    ]

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
      tools,
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
