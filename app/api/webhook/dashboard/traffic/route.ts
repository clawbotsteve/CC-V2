import { NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants'
import { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const token = authHeader.substring('Bearer '.length)
    if (token !== INTERNAL_DASHBOARD_TOKEN) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const {
      dateFrom,
      dateTo,
      granularity = 'day',
      urlFilter,
      sourceFilter,
    } = body

    const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const to = dateTo ? new Date(dateTo + 'T23:59:59.999Z') : new Date()

    const where: Prisma.PageViewWhereInput = {
      createdAt: { gte: from, lte: to },
      ...(urlFilter ? { url: { startsWith: urlFilter } } : {}),
      ...(sourceFilter ? { referrerDomain: sourceFilter } : {}),
    }

    // Summary
    const [totalPageViews, uniqueVisitorsResult] = await Promise.all([
      prismadb.pageView.count({ where }),
      prismadb.pageView.findMany({
        where,
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
    ])
    const uniqueVisitors = uniqueVisitorsResult.length

    // Time series via raw SQL
    const granMap: Record<string, string> = { day: 'day', week: 'week', month: 'month' }
    const gran = granMap[granularity] || 'day'

    const timeSeries = await prismadb.$queryRaw<
      Array<{ period: Date; pageViews: bigint; uniqueVisitors: bigint }>
    >`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${gran}'`)}, "createdAt") as period,
        COUNT(*)::bigint as "pageViews",
        COUNT(DISTINCT "visitorId")::bigint as "uniqueVisitors"
      FROM "PageView"
      WHERE "createdAt" >= ${from}
        AND "createdAt" <= ${to}
        ${urlFilter ? Prisma.sql`AND "url" LIKE ${urlFilter + '%'}` : Prisma.empty}
        ${sourceFilter ? Prisma.sql`AND "referrerDomain" = ${sourceFilter}` : Prisma.empty}
      GROUP BY period
      ORDER BY period ASC
    `

    // Top pages
    const topPages = await prismadb.pageView.groupBy({
      by: ['url'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    })

    // Get unique visitors per top page
    const topPagesWithUniques = await Promise.all(
      topPages.map(async (p) => {
        const uniques = await prismadb.pageView.findMany({
          where: { ...where, url: p.url },
          select: { visitorId: true },
          distinct: ['visitorId'],
        })
        return { url: p.url, views: p._count.id, uniqueVisitors: uniques.length }
      })
    )

    // Traffic sources
    const trafficSources = await prismadb.pageView.groupBy({
      by: ['referrerDomain'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    })

    const trafficSourcesFormatted = trafficSources.map((s) => ({
      referrerDomain: s.referrerDomain || '(direct)',
      views: s._count.id,
    }))

    // UTM breakdown
    const utmBreakdown = await prismadb.pageView.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: { ...where, utmSource: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    })

    const utmFormatted = utmBreakdown.map((u) => ({
      utmSource: u.utmSource,
      utmMedium: u.utmMedium,
      utmCampaign: u.utmCampaign,
      views: u._count.id,
    }))

    // Affiliate traffic
    const affiliateTraffic = await prismadb.pageView.groupBy({
      by: ['affiliateCode'],
      where: { ...where, affiliateCode: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    })

    const affiliateFormatted = affiliateTraffic.map((a) => ({
      affiliateCode: a.affiliateCode,
      views: a._count.id,
    }))

    // Device breakdown
    const [browsers, osList, deviceTypes] = await Promise.all([
      prismadb.pageView.groupBy({
        by: ['browser'],
        where: { ...where, browser: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prismadb.pageView.groupBy({
        by: ['os'],
        where: { ...where, os: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prismadb.pageView.groupBy({
        by: ['deviceType'],
        where: { ...where, deviceType: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    const formatDeviceData = (data: Array<{ _count: { id: number } } & Record<string, any>>, key: string) => {
      const total = data.reduce((sum, d) => sum + d._count.id, 0)
      return data.map((d) => ({
        [key]: d[key],
        views: d._count.id,
        percentage: total > 0 ? Math.round((d._count.id / total) * 1000) / 10 : 0,
      }))
    }

    // Country breakdown
    const countries = await prismadb.pageView.groupBy({
      by: ['country'],
      where: { ...where, country: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    })

    const countriesFormatted = countries.map((c) => ({
      country: c.country,
      views: c._count.id,
    }))

    return NextResponse.json({
      summary: {
        totalPageViews,
        uniqueVisitors,
        avgViewsPerVisitor: uniqueVisitors > 0 ? Math.round((totalPageViews / uniqueVisitors) * 100) / 100 : 0,
        topCountry: countries[0]?.country || 'N/A',
      },
      timeSeries: timeSeries.map((t) => ({
        date: t.period.toISOString().split('T')[0],
        pageViews: Number(t.pageViews),
        uniqueVisitors: Number(t.uniqueVisitors),
      })),
      topPages: topPagesWithUniques,
      trafficSources: trafficSourcesFormatted,
      utmBreakdown: utmFormatted,
      affiliateTraffic: affiliateFormatted,
      devices: {
        browsers: formatDeviceData(browsers, 'browser'),
        os: formatDeviceData(osList, 'os'),
        deviceTypes: formatDeviceData(deviceTypes, 'deviceType'),
      },
      countries: countriesFormatted,
    })
  } catch (error) {
    console.error('[DASHBOARD_TRAFFIC]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
