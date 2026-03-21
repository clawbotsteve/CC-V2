import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
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
    const page = Math.max(1, body.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, body.pageSize ?? 25))
    const search = (body.search ?? '').trim()
    const planFilter = body.planFilter ?? null // e.g. "plan_basic", "plan_pro", "plan_elite"
    const statusFilter = body.statusFilter ?? null // "active", "canceled", "banned"
    const sortBy = body.sortBy ?? 'createdAt' // "createdAt", "lastActiveAt", "creditUsed"
    const sortOrder = body.sortOrder ?? 'desc'

    // Build user where clause
    const userWhere: any = {}

    if (search) {
      userWhere.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (statusFilter === 'banned') {
      userWhere.isBanned = true
    } else if (statusFilter === 'active') {
      userWhere.isActive = true
      userWhere.isBanned = false
    }

    // Get total count for pagination
    const totalUsers = await prismadb.user.count({ where: userWhere })

    // Get users with pagination
    const users = await prismadb.user.findMany({
      where: userWhere,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        imageUrl: true,
        isActive: true,
        isBanned: true,
        lastActiveAt: true,
        lastLoginAt: true,
        totalLogins: true,
        createdAt: true,
      },
    })

    // Backfill missing emails from Clerk
    const usersNeedingEmail = users.filter((u) => !u.email)
    if (usersNeedingEmail.length > 0) {
      try {
        const clerk = await clerkClient()
        const clerkUpdates = await Promise.allSettled(
          usersNeedingEmail.map(async (u) => {
            const clerkUser = await clerk.users.getUser(u.userId)
            const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''
            const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')
            if (email) {
              // Backfill the database so we don't need to hit Clerk again
              await prismadb.user.update({
                where: { userId: u.userId },
                data: { email, name: name || undefined },
              })
            }
            return { userId: u.userId, email, name }
          })
        )
        // Apply fetched emails to the current response
        const emailMap = new Map<string, { email: string; name: string }>()
        for (const result of clerkUpdates) {
          if (result.status === 'fulfilled' && result.value.email) {
            emailMap.set(result.value.userId, result.value)
          }
        }
        for (const user of users) {
          const clerkData = emailMap.get(user.userId)
          if (clerkData) {
            ;(user as any).email = clerkData.email
            ;(user as any).name = clerkData.name || user.name
          }
        }
      } catch (clerkError) {
        console.error('[DASHBOARD_USERS] Clerk email backfill failed:', clerkError)
        // Continue without emails rather than failing the entire request
      }
    }

    // Batch fetch subscriptions and credits for these users
    const userIds = users.map((u) => u.userId)

    const [subscriptions, apiLimits] = await Promise.all([
      prismadb.userSubscription.findMany({
        where: { userId: { in: userIds } },
        include: { plan: { select: { tier: true, name: true, price: true, period: true } } },
      }),
      prismadb.userApiLimit.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          availableCredit: true,
          creditUsed: true,
          monthlyRemainingCredits: true,
          availableAvatarSlot: true,
          avatarSlotUsed: true,
        },
      }),
    ])

    // Create lookup maps
    const subMap = new Map(subscriptions.map((s) => [s.userId, s]))
    const creditMap = new Map(apiLimits.map((a) => [a.userId, a]))

    // Filter by plan if requested
    let enrichedUsers = users.map((user) => {
      const sub = subMap.get(user.userId)
      const credits = creditMap.get(user.userId)
      return {
        ...user,
        subscription: sub
          ? {
              planTier: sub.plan.tier,
              planName: sub.plan.name,
              price: sub.plan.price,
              period: sub.plan.period,
              status: sub.status,
              currentPeriodEnd: sub.phyziroCurrentPeriodEnd,
            }
          : null,
        credits: credits
          ? {
              available: credits.availableCredit,
              used: credits.creditUsed,
              monthlyRemaining: credits.monthlyRemainingCredits,
              avatarSlots: credits.availableAvatarSlot,
              avatarSlotsUsed: credits.avatarSlotUsed,
            }
          : null,
      }
    })

    // Apply plan filter client-side (simpler than complex join)
    if (planFilter) {
      enrichedUsers = enrichedUsers.filter(
        (u) => u.subscription?.planTier === planFilter
      )
    }

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        pageSize,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / pageSize),
      },
    })
  } catch (error) {
    console.error('[DASHBOARD_USERS_ERROR]', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
