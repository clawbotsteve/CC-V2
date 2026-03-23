import { NextResponse } from 'next/server'
import { UAParser } from 'ua-parser-js'
import prismadb from '@/lib/prismadb'

const BOT_REGEX = /bot|crawler|spider|slurp|facebookexternalhit|googlebot|bingbot|yandex|baidu|semrush|ahref|lighthouse|pingdom|uptimerobot/i

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || ''

    // Filter bots
    if (BOT_REGEX.test(userAgent)) {
      return new NextResponse(null, { status: 204 })
    }

    const body = await request.json()
    const { url, referrer, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, affiliateCode, visitorId } = body

    if (!url || !visitorId) {
      return new NextResponse(null, { status: 204 })
    }

    // Parse user agent
    const parser = new UAParser(userAgent)
    const browserResult = parser.getBrowser()
    const osResult = parser.getOS()
    const deviceResult = parser.getDevice()

    // Parse referrer domain
    let referrerDomain: string | null = null
    if (referrer) {
      try {
        const refUrl = new URL(referrer)
        referrerDomain = refUrl.hostname
      } catch {}
    }

    // Get country from Vercel header
    const country = request.headers.get('x-vercel-ip-country') || null

    // Determine device type
    const deviceType = deviceResult.type || 'desktop'

    // Fire and forget — don't await
    prismadb.pageView.create({
      data: {
        visitorId,
        url,
        referrer: referrer || null,
        referrerDomain,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmTerm: utmTerm || null,
        utmContent: utmContent || null,
        affiliateCode: affiliateCode || null,
        userAgent,
        browser: browserResult.name || null,
        os: osResult.name || null,
        deviceType,
        country,
      },
    }).catch((err) => {
      console.error('[ANALYTICS_TRACK]', err)
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[ANALYTICS_TRACK]', error)
    return new NextResponse(null, { status: 204 })
  }
}
