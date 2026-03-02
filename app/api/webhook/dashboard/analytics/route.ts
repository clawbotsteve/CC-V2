import { NextResponse } from 'next/server'
import { subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants'

export async function POST(request: Request) {
  try {
    // Check Authorization header for Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.substring('Bearer '.length)
    if (token !== INTERNAL_DASHBOARD_TOKEN) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const now = new Date()

    // Current and previous month ranges
    const currentStart = startOfMonth(now)
    const currentEnd = endOfMonth(now)
    const previousStart = startOfMonth(subMonths(now, 1))
    const previousEnd = endOfMonth(subMonths(now, 1))

    // Get current and previous subscriptions
    const currentSubs = await prismadb.userSubscription.findMany({
      where: { status: 'active', createdAt: { gte: currentStart, lte: currentEnd } },
    })

    const previousSubs = await prismadb.userSubscription.findMany({
      where: { status: 'active', createdAt: { gte: previousStart, lte: previousEnd } },
    })

    // Total active subscriptions now
    const totalActive = await prismadb.userSubscription.count({
      where: { status: 'active' },
    })

    // Cancellations in current period
    const canceledSubs = await prismadb.userSubscription.count({
      where: {
        status: 'canceled',
        updatedAt: { gte: currentStart, lte: currentEnd },
      },
    })

    // Subscription growth rate
    const growthRate =
      previousSubs.length > 0
        ? ((currentSubs.length - previousSubs.length) / previousSubs.length) * 100
        : null

    // Churn rate
    const churnRate =
      totalActive + canceledSubs > 0
        ? (canceledSubs / (totalActive + canceledSubs)) * 100
        : null

    // MRR & ARR (based on active subs)
    const activeSubs = await prismadb.userSubscription.findMany({
      where: { status: 'active' },
      include: { plan: true },
    })

    let mrr = 0
    activeSubs.forEach(sub => {
      if (sub.plan.period === 'monthly') mrr += sub.plan.price
      if (sub.plan.period === 'yearly') mrr += sub.plan.price / 12
    })
    const arr = mrr * 12

    // Top Plans
    // 1. Group by planId and count
    const grouped = await prismadb.userSubscription.groupBy({
      by: ['planId'],
      _count: true,
      orderBy: { _count: { planId: 'desc' } },
      take: 3,
    })

    // 2. Fetch plan names
    const planIds = grouped.map(g => g.planId)

    const plans = await prismadb.subscriptionTier.findMany({
      where: { id: { in: planIds } },
      select: { id: true, tier: true },
    })

    // 3. Merge counts with plan names
    const topPlans = grouped.map(g => {
      const plan = plans.find(p => p.id === g.planId)
      return {
        planId: g.planId,
        count: g._count,
        name: plan?.tier ?? 'Unknown',
      }
    })

    // Cohort analysis by signup month
    const cohorts = await prismadb.userApiLimit.findMany({
      select: { createdAt: true },
    })

    const cohortCounts: { [key: string]: number } = {}
    cohorts.forEach(entry => {
      const key = `${entry.createdAt.getFullYear()}-${entry.createdAt.getMonth() + 1}`
      cohortCounts[key] = (cohortCounts[key] || 0) + 1
    })

    /**
     * ✅ NEW: Daily Sign-up & Subscription Trend (Current Month)
     */
    const days = eachDayOfInterval({ start: currentStart, end: currentEnd })

    // Fetch all signups (assuming `user` table exists for signups)
    const signups = await prismadb.user.findMany({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
      select: { createdAt: true },
    })

    // Fetch all subscriptions (any status)
    const subs = await prismadb.userSubscription.findMany({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
      select: { createdAt: true },
    })

    const dailyTrend = days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      const signUpCount = signups.filter(u => format(u.createdAt, 'yyyy-MM-dd') === dayKey).length
      const subCount = subs.filter(s => format(s.createdAt, 'yyyy-MM-dd') === dayKey).length

      return {
        date: dayKey,
        signUps: signUpCount,
        subscriptions: subCount,
      }
    })

    return NextResponse.json({
      growthRate: growthRate?.toFixed(2),
      churnRate: churnRate?.toFixed(2),
      mrr: mrr.toFixed(2),
      arr: arr.toFixed(2),
      topPlans,
      cohortCounts,
      dailyTrend
    })
  } catch (error) {
    console.error('[SUB_ANALYTICS_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
