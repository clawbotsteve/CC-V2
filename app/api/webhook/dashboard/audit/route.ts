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
    const page = Math.max(1, body.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, body.pageSize ?? 50))
    const actionFilter = body.action ?? null
    const targetUserId = body.targetUserId ?? null

    const where: any = {}
    if (actionFilter) where.action = actionFilter
    if (targetUserId) where.targetUserId = targetUserId

    const [logs, total] = await Promise.all([
      prismadb.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prismadb.adminAuditLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('[DASHBOARD_AUDIT_ERROR]', error)
    return NextResponse.json({ error: 'Failed to load audit logs' }, { status: 500 })
  }
}
