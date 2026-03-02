import { NextRequest, NextResponse } from 'next/server'
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns'
import prismadb from '@/lib/prismadb'
import { PrismaClient } from '@prisma/client'
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants'

const VALID_FILTERS = [
  'daily',
  'yesterday',
  'last-3-days',
  'last-7-days',
  'last-15-days',
  'last-month',
  'last-3-months',
] as const

type FilterType = typeof VALID_FILTERS[number]

const getDateRange = (filter: FilterType): {
  currentStart: Date
  currentEnd: Date
  previousStart: Date
  previousEnd: Date
} => {
  const now = new Date()

  switch (filter) {
    case 'daily': {
      const currentStart = startOfDay(now)
      const currentEnd = endOfDay(now)
      const previousStart = startOfDay(subDays(now, 1))
      const previousEnd = endOfDay(subDays(now, 1))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }

    case 'yesterday': {
      const currentStart = startOfDay(subDays(now, 1))
      const currentEnd = endOfDay(subDays(now, 1))
      const previousStart = startOfDay(subDays(now, 2))
      const previousEnd = endOfDay(subDays(now, 2))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }

    case 'last-3-days': {
      const currentStart = startOfDay(subDays(now, 3))
      const currentEnd = endOfDay(now)
      const previousStart = startOfDay(subDays(now, 6))
      const previousEnd = endOfDay(subDays(now, 4))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }

    case 'last-7-days': {
      const currentStart = startOfDay(subDays(now, 7))
      const currentEnd = endOfDay(now)
      const previousStart = startOfDay(subDays(now, 14))
      const previousEnd = endOfDay(subDays(now, 8))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }

    case 'last-15-days': {
      const currentStart = startOfDay(subDays(now, 15))
      const currentEnd = endOfDay(now)
      const previousStart = startOfDay(subDays(now, 30))
      const previousEnd = endOfDay(subDays(now, 16))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }

    case 'last-month': {
      const currentStart = startOfMonth(subMonths(now, 1))
      const currentEnd = endOfMonth(subMonths(now, 1))
      const previousStart = startOfMonth(subMonths(now, 2))
      const previousEnd = endOfMonth(subMonths(now, 2))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }

    case 'last-3-months': {
      const currentStart = startOfMonth(subMonths(now, 3))
      const currentEnd = endOfDay(now)
      const previousStart = startOfMonth(subMonths(now, 6))
      const previousEnd = endOfDay(subMonths(now, 3))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }

    default: {
      const currentStart = startOfDay(now)
      const currentEnd = endOfDay(now)
      const previousStart = startOfDay(subDays(now, 1))
      const previousEnd = endOfDay(subDays(now, 1))
      return { currentStart, currentEnd, previousStart, previousEnd }
    }
  }
}

const withChange = (current: number, previous: number) => {
  if (previous === 0) return { current, previous, change: null }
  const change = ((current - previous) / previous) * 100
  return { current, previous, change: parseFloat(change.toFixed(2)) }
}

const dateFieldMap: Record<string, string> = {
  loraPurchase: 'purchasedAt',
  generatedImage: 'createdAt',
  generatedVideo: 'createdAt',
  upscaled: 'createdAt',
  faceSwap: 'createdAt',
  faceEnhance: 'createdAt',
  imageEdit: 'createdAt',
  imageAnalysis: 'createdAt',
  influencer: 'createdAt',
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  if (token !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const filter: FilterType = VALID_FILTERS.includes(body.filter)
      ? body.filter
      : 'daily'

    const { currentStart, currentEnd, previousStart, previousEnd } =
      getDateRange(filter)

    // USER SIGNUPS
    const usersSignedUpNow = await prismadb.userApiLimit.count({
      where: {
        createdAt: { gte: currentStart, lte: currentEnd },
      },
    })
    const usersSignedUpBefore = await prismadb.userApiLimit.count({
      where: {
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    })

    // USER SUBSCRIPTIONS (split by tier)
    const userIdsNow = await prismadb.userApiLimit.findMany({
      where: {
        createdAt: { gte: currentStart, lte: currentEnd },
      },
      select: { userId: true },
    })
    const userIdsBefore = await prismadb.userApiLimit.findMany({
      where: {
        createdAt: { gte: previousStart, lte: previousEnd },
      },
      select: { userId: true },
    })

    const getCountByTier = async (userIds: string[], tier: string) =>
      await prismadb.userSubscription.count({
        where: {
          status: 'active',
          userId: { in: userIds },
          plan: { tier },
        },
      })

    const tiers = ['plan_basic', 'plan_pro', 'plan_elite'] as const
    const tierStats = await Promise.all(
      tiers.map(async (tier) => {
        const current = await getCountByTier(
          userIdsNow.map((u) => u.userId),
          tier
        )
        const previous = await getCountByTier(
          userIdsBefore.map((u) => u.userId),
          tier
        )
        return { [tier]: withChange(current, previous) }
      })
    )

    const basic = tierStats[0]['plan_basic']
    const pro = tierStats[1]['plan_pro']
    const elite = tierStats[2]['plan_elite']

    // TOOL STATS
    const stats = [
      'loraPurchase',
      'generatedImage',
      'generatedVideo',
      'upscaled',
      'faceSwap',
      'faceEnhance',
      'imageEdit',
      'imageAnalysis',
      'influencer',
    ] as const

    const toolStats = await Promise.all(
      stats.map(async (model) => {
        const dbModel = prismadb[model as keyof PrismaClient] as {
          count: (args: any) => Promise<number>
        }

        const dateField = dateFieldMap[model] || 'createdAt'

        // console.log(`🔍 Fetching ${model} for current range: ${currentStart.toLocaleString()} → ${currentEnd.toLocaleString()}`)

        const current = await dbModel.count({
          where: {
            [dateField]: {
              gte: currentStart,
              lte: currentEnd,
            },
          },
        })

        // console.log(`🔁 Fetching ${model} for previous range: ${previousStart.toLocaleString()} → ${previousEnd.toLocaleString()}`)


        const previous = await dbModel.count({
          where: {
            [dateField]: {
              gte: previousStart,
              lte: previousEnd,
            },
          },
        })

        return { [model]: withChange(current, previous) }
      })
    )

    const response = {
      filter,
      range: {
        currentStart,
        currentEnd,
        previousStart,
        previousEnd,
      },
      usersSignedUp: withChange(usersSignedUpNow, usersSignedUpBefore),
      subscriptions: {
        basic,
        pro,
        elite,
      },
      tools: Object.assign({}, ...toolStats),
    }

    // console.log(response)
    const now = new Date()

    // console.log('Current Time:', now.toLocaleString())

    // console.log('Date Range:', {
    //   currentStart: currentStart.toLocaleString(),
    //   currentEnd: currentEnd.toLocaleString(),
    //   previousStart: previousStart.toLocaleString(),
    //   previousEnd: previousEnd.toLocaleString(),
    // })


    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
