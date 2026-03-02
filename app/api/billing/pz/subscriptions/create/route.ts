import { planPacks } from '@/constants/pricing-constants'
import { NextResponse } from 'next/server'

const ELECTRYT_API_URL = 'https://phyziro.com/chain/electryt/router.php'

const headers = {
  'Electryt-Version': '0.0.2',
  Authorization: process.env.ELECTRYT_AUTH!,
  'Ele-Service': process.env.ELECTRYT_SERVICE!,
  Verification: 'Electryt-WAY',
  'Ele-Way-Key': process.env.ELECTRYT_WAY_KEY!,
  'Ele-Node': process.env.ELECTRYT_NODE!,
  'Ele-Handshake': 'LAUNCH',
  'Ele-Token-Class': 'DART',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function POST() {
  const monthlyPlans = Object.values(planPacks).filter(
    (p) => p.period === 'monthly' && p.price > 0,
  )

  const createdPlans: { name: string; id?: string; error?: string }[] = []

  for (const plan of monthlyPlans) {
    // Convert price dollars to cents (e.g. 29.95 -> 2995)
    const priceCents = Math.round(plan.price * 100)
    const cleanAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "")
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");


    const body = [
      {
        referrer: {
          network: 'external',
          type: 'website',
        },
        request: [
          {
            task: 'subscription_create',
            auth: 'no_auth',
            mount: {
              virtuality: 'self-hosted',
              multi_task: [],
              app: {
                id: process.env.ELECTRYT_APP_ID,
              },
              billing: {
                isRecurring: {
                  id: null,
                  active: true,
                  frequency: 'monthly',
                  isTrial: false,
                  trialDays: 0,
                },
                details: {
                  name: plan.name,
                  icon_url: '',
                  auxillary_label: plan.tier,
                  description: `Credits: ${plan.creditsPerMonth}, Max Avatars: ${plan.maxAvatarCount}`,
                  perks: {
                    perk0: `Credits per month: ${plan.creditsPerMonth}`,
                    perk1: `Max Avatars: ${plan.maxAvatarCount}`,
                  },
                  monthly_credit_endowment: plan.creditsPerMonth,
                },
                business: {
                  name: 'CoreGen',
                  vertical: 'Entertainment',
                  niche: 'Artificial Intelligence',
                },
                payment: {
                  tender: {
                    fiat: {
                      currency: 'usd',
                      quantity: priceCents,
                      unit_measurement: 'pennies',
                    },
                    crypto: {
                      protocol: 'electryt',
                      quantity: 1,
                      mint: 'neon',
                      unit_measurement: 'gems',
                    },
                  },
                },
                economy: {
                  currency: '',
                },
              },
            },
          },
        ],
      },
    ]

    const res = await fetch(ELECTRYT_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    console.log(JSON.stringify(body, null, 2));

    const json = await res.json()

    console.log({
      json
    })

    if (json?.result?.subscription?.id) {
      createdPlans.push({ name: plan.name, id: json.result.subscription.id })
    } else {
      createdPlans.push({ name: plan.name, error: 'Failed to create' })
    }
  }

  return NextResponse.json({ created: createdPlans })
}
