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
    const { userId, availableCredit, monthlyRemainingCredits, availableAvatarSlot } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const userLimit = await prismadb.userApiLimit.findUnique({ where: { userId } })
    if (!userLimit) {
      return NextResponse.json({ error: 'UserApiLimit not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (typeof availableCredit === 'number') updateData.availableCredit = availableCredit
    if (typeof monthlyRemainingCredits === 'number') updateData.monthlyRemainingCredits = monthlyRemainingCredits
    if (typeof availableAvatarSlot === 'number') updateData.availableAvatarSlot = availableAvatarSlot

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prismadb.userApiLimit.update({
      where: { userId },
      data: updateData,
    })

    // Audit log
    await prismadb.adminAuditLog.create({
      data: {
        adminUserId: body.adminUserId ?? 'system',
        action: 'set_credits',
        targetUserId: userId,
        details: {
          before: { availableCredit: userLimit.availableCredit, monthlyRemainingCredits: userLimit.monthlyRemainingCredits, availableAvatarSlot: userLimit.availableAvatarSlot },
          after: { availableCredit: updated.availableCredit, monthlyRemainingCredits: updated.monthlyRemainingCredits, availableAvatarSlot: updated.availableAvatarSlot },
        },
      },
    })

    return NextResponse.json({
      message: 'Credits updated',
      before: {
        availableCredit: userLimit.availableCredit,
        monthlyRemainingCredits: userLimit.monthlyRemainingCredits,
        availableAvatarSlot: userLimit.availableAvatarSlot,
      },
      after: {
        availableCredit: updated.availableCredit,
        monthlyRemainingCredits: updated.monthlyRemainingCredits,
        availableAvatarSlot: updated.availableAvatarSlot,
      },
    })
  } catch (error) {
    console.error('[DASHBOARD_SET_CREDITS_ERROR]', error)
    return NextResponse.json({ error: 'Failed to set credits' }, { status: 500 })
  }
}
