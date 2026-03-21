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
    const { userId, banned } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    if (typeof banned !== 'boolean') {
      return NextResponse.json({ error: 'banned must be a boolean' }, { status: 400 })
    }

    const user = await prismadb.user.findUnique({ where: { userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await prismadb.user.update({
      where: { userId },
      data: {
        isBanned: banned,
        isActive: !banned,
      },
    })

    // Audit log
    await prismadb.adminAuditLog.create({
      data: {
        adminUserId: body.adminUserId ?? 'system',
        action: banned ? 'ban_user' : 'unban_user',
        targetUserId: userId,
        details: { banned },
      },
    })

    return NextResponse.json({
      message: banned ? 'User banned' : 'User unbanned',
      user: {
        userId: updated.userId,
        name: updated.name,
        email: updated.email,
        isBanned: updated.isBanned,
        isActive: updated.isActive,
      },
    })
  } catch (error) {
    console.error('[DASHBOARD_BAN_ERROR]', error)
    return NextResponse.json({ error: 'Failed to update ban status' }, { status: 500 })
  }
}
