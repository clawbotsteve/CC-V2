import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import prismadb from '@/lib/prismadb'
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants'
import { assignPlan } from '@/lib/assign-plan'
import { getPlanIdByTier } from '@/lib/get-plan-id-by-tier'
import { PLAN_FREE } from '@/constants'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (authHeader.substring(7) !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  try {
    const clerk = await clerkClient()

    // Fetch all users from Clerk (paginated)
    const allClerkUsers: {
      id: string
      firstName: string | null
      lastName: string | null
      emailAddresses: { emailAddress: string }[]
      hasImage: boolean
      imageUrl: string
    }[] = []

    let offset = 0
    const limit = 100
    while (true) {
      const batch = await clerk.users.getUserList({ limit, offset })
      allClerkUsers.push(
        ...batch.data.map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          emailAddresses: u.emailAddresses.map((e) => ({
            emailAddress: e.emailAddress,
          })),
          hasImage: u.hasImage,
          imageUrl: u.imageUrl,
        }))
      )
      if (batch.data.length < limit) break
      offset += limit
    }

    // Get all existing user IDs from DB
    const existingUsers = await prismadb.user.findMany({
      select: { userId: true },
    })
    const existingUserIds = new Set(existingUsers.map((u) => u.userId))

    // Find missing users
    const missingUsers = allClerkUsers.filter(
      (u) => !existingUserIds.has(u.id)
    )

    if (missingUsers.length === 0) {
      return NextResponse.json({
        synced: 0,
        failed: 0,
        totalClerk: allClerkUsers.length,
        totalDb: existingUsers.length,
        message: 'All Clerk users are already in the database',
      })
    }

    // Get the free plan ID once
    const freePlanId = await getPlanIdByTier(PLAN_FREE)

    const results: { synced: string[]; failed: { userId: string; error: string }[] } = {
      synced: [],
      failed: [],
    }

    // Create missing users in batches
    for (const clerkUser of missingUsers) {
      try {
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const name = [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(' ')

        // Create User record
        await prismadb.user.create({
          data: {
            userId: clerkUser.id,
            name,
            email,
            imageUrl: clerkUser.hasImage ? clerkUser.imageUrl : '',
            referralCode: '',
            firstVisit: false,
          },
        })

        // Assign free plan (creates UserSubscription + UserApiLimit)
        await assignPlan(clerkUser.id, freePlanId)

        results.synced.push(clerkUser.id)
      } catch (err: any) {
        results.failed.push({
          userId: clerkUser.id,
          error: err.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      synced: results.synced.length,
      failed: results.failed.length,
      failedDetails: results.failed,
      totalClerk: allClerkUsers.length,
      totalDb: existingUsers.length + results.synced.length,
      message: `Synced ${results.synced.length} missing users. ${results.failed.length} failed.`,
    })
  } catch (error: any) {
    console.error('[SYNC_USERS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to sync users', details: error.message },
      { status: 500 }
    )
  }
}
