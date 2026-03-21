import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants'
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
  subMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
} from 'date-fns'

type Granularity = 'daily' | 'weekly' | 'monthly'

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
    const granularity: Granularity = body.granularity ?? 'daily'
    const days = body.days ?? 30 // how far back to look
    const now = new Date()
    const rangeStart = startOfDay(subDays(now, days))
    const rangeEnd = endOfDay(now)

    // Query all generation tables for the date range using raw SQL for efficiency
    const [images, videos, upscales, faceSwaps, faceEnhances, imageEdits, imageAnalyses] =
      await Promise.all([
        prismadb.generatedImage.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { createdAt: true, creditUsed: true, status: true, variant: true },
        }),
        prismadb.generatedVideo.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { createdAt: true, creditUsed: true, status: true, variant: true, model: true },
        }),
        prismadb.upscaled.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { createdAt: true, creditUsed: true, status: true },
        }),
        prismadb.faceSwap.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { createdAt: true, creditUsed: true, status: true },
        }),
        prismadb.faceEnhance.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { createdAt: true, creditUsed: true, status: true },
        }),
        prismadb.imageEdit.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { createdAt: true, creditUsed: true, status: true },
        }),
        prismadb.imageAnalysis.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { createdAt: true, creditUsed: true, status: true },
        }),
      ])

    // Generate time buckets based on granularity
    let buckets: { start: Date; label: string }[]

    if (granularity === 'daily') {
      buckets = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
        start: d,
        label: format(d, 'yyyy-MM-dd'),
      }))
    } else if (granularity === 'weekly') {
      buckets = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
        start: d,
        label: `Week of ${format(d, 'yyyy-MM-dd')}`,
      }))
    } else {
      buckets = eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
        start: d,
        label: format(d, 'yyyy-MM'),
      }))
    }

    // Helper to get bucket key for a date
    const getBucketKey = (date: Date): string => {
      if (granularity === 'daily') return format(date, 'yyyy-MM-dd')
      if (granularity === 'weekly') return `Week of ${format(startOfWeek(date), 'yyyy-MM-dd')}`
      return format(date, 'yyyy-MM')
    }

    // Aggregate all generations into buckets
    type BucketData = {
      label: string
      images: number
      videos: number
      upscales: number
      faceSwaps: number
      faceEnhances: number
      imageEdits: number
      imageAnalyses: number
      total: number
      creditsUsed: number
      completed: number
      failed: number
    }

    const bucketMap = new Map<string, BucketData>()
    for (const b of buckets) {
      bucketMap.set(b.label, {
        label: b.label,
        images: 0,
        videos: 0,
        upscales: 0,
        faceSwaps: 0,
        faceEnhances: 0,
        imageEdits: 0,
        imageAnalyses: 0,
        total: 0,
        creditsUsed: 0,
        completed: 0,
        failed: 0,
      })
    }

    const addToBucket = (
      items: { createdAt: Date; creditUsed: number; status: string }[],
      field: keyof Omit<BucketData, 'label' | 'total' | 'creditsUsed' | 'completed' | 'failed'>
    ) => {
      for (const item of items) {
        const key = getBucketKey(item.createdAt)
        const bucket = bucketMap.get(key)
        if (bucket) {
          bucket[field]++
          bucket.total++
          bucket.creditsUsed += item.creditUsed
          if (item.status === 'completed') bucket.completed++
          if (item.status === 'failed') bucket.failed++
        }
      }
    }

    addToBucket(images, 'images')
    addToBucket(videos, 'videos')
    addToBucket(upscales, 'upscales')
    addToBucket(faceSwaps, 'faceSwaps')
    addToBucket(faceEnhances, 'faceEnhances')
    addToBucket(imageEdits, 'imageEdits')
    addToBucket(imageAnalyses, 'imageAnalyses')

    const timeline = Array.from(bucketMap.values())

    // Summary totals
    const allItems = [
      ...images,
      ...videos,
      ...upscales,
      ...faceSwaps,
      ...faceEnhances,
      ...imageEdits,
      ...imageAnalyses,
    ]

    const summary = {
      totalGenerations: allItems.length,
      totalCreditsUsed: allItems.reduce((sum, i) => sum + i.creditUsed, 0),
      completed: allItems.filter((i) => i.status === 'completed').length,
      failed: allItems.filter((i) => i.status === 'failed').length,
      byType: {
        images: images.length,
        videos: videos.length,
        upscales: upscales.length,
        faceSwaps: faceSwaps.length,
        faceEnhances: faceEnhances.length,
        imageEdits: imageEdits.length,
        imageAnalyses: imageAnalyses.length,
      },
    }

    // Video breakdown by model/variant
    const videoBreakdown: Record<string, number> = {}
    for (const v of videos) {
      const key = v.variant ?? v.model ?? 'unknown'
      videoBreakdown[key] = (videoBreakdown[key] ?? 0) + 1
    }

    return NextResponse.json({
      granularity,
      days,
      rangeStart,
      rangeEnd,
      summary,
      videoBreakdown,
      timeline,
    })
  } catch (error) {
    console.error('[DASHBOARD_GENERATIONS_ERROR]', error)
    return NextResponse.json({ error: 'Failed to load generation analytics' }, { status: 500 })
  }
}
