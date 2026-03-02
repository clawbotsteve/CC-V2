import { NextResponse } from 'next/server'

const ELECTRYT_API_URL = 'https://phyziro.com/chain/electryt/router.php'

const headers = {
  'Content_': 'application/json;charset=utf-8',
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

export async function POST(req: Request) {
  const { email, userId, subscriptionId } = await req.json()

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
  }

  const cleanAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");


  const paymentBody = [
    {
      referrer: { network: 'external', type: 'website' },
      request: [
        {
          task: 'subscription_live_pay_session',
          auth: 'no_auth',
          mount: {
            virtuality: 'self-hosted',
            multi_task: [],
            experiment: process.env.NODE_ENV === "development",
            app: { id: process.env.ELECTRYT_APP_ID },
            subscription: { id: subscriptionId },
            payment: {
              nonce: "",
              tender: {
                fiat: {
                  currency: "usd",
                  quantity: 1,
                  unit_measurement: "pennies",
                  yield: {
                    credits: 0
                  }
                },
                crypto: {
                  protocol: "electryt",
                  quantity: 1,
                  mint: "neon",
                  unit_measurement: "gems",
                  yield: {
                    credits: 0
                  }
                }
              }
            },
            return_url: {
              protocol: 'https',
              hostname: cleanAppUrl,
              eTLD: '',
              port: '',
              parameters: [{ s_id: null }],
              path: '/settings',
            },
          },
        },
      ],
      customer: {
        'digital-identity': '',
        'external-id': userId,
        'external-access-key': '',
        email,
        phone: '',
        custom: [''],
      },
    },
  ]

  const payRes = await fetch(ELECTRYT_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(paymentBody),
  })

  console.log(JSON.stringify(paymentBody, null, 2))

  const payData = await payRes.json()

  console.log({
    payData
  })

  const paymentUrl = payData?.success_url

  if (!paymentUrl) {
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 400 })
  }

  return NextResponse.json({ url: paymentUrl })
}
