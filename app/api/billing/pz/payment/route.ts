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
  const {
    email,
    userId,
    price,        // 🔹 in USD cents (e.g. 4500 for $45.00)
    title,
    note,
    nonce         // string: lora | charge
  } = await req.json()

  console.log({
    email,
    userId,
    price,
    title,
    note,
    nonce
  })

  if (!userId || !price || !title) {
    return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 })
  }

  const priceCents = Math.round(price * 100)
  const cleanAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");


  const paymentBody = [
    {
      referrer: { network: 'external', type: 'website' },
      request: [
        {
          task: 'one_time_live_pay_session',
          auth: 'no_auth',
          mount: {
            virtuality: 'self-hosted',
            multi_task: [],
            experiment: process.env.NODE_ENV === "development",
            app: { id: process.env.ELECTRYT_APP_ID },
            payment: {
              nonce: nonce,
              tender: {
                fiat: {
                  currency: 'usd',
                  quantity: priceCents,
                  unit_measurement: 'pennies',
                  yield: { credits: '0' },
                },
                crypto: {
                  protocol: 'electryt',
                  quantity: 1,
                  mint: 'neon',
                  unit_measurement: 'gems',
                  yield: { credits: '100' },
                },
              },
              title,
              note,
              access: [],
            },
            return_url: {
              protocol: 'https',
              hostname: cleanAppUrl,
              eTLD: '',
              port: '',
              parameters: [{ s_id: null }],
              path: nonce?.startsWith("charge") ? "/dashboard/get-credits" : "/dashboard",
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

  const res = await fetch(ELECTRYT_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(paymentBody),
  })

  const data = await res.json()

  if (!data?.success_url) {
    console.error('Electryt error:', JSON.stringify(data, null, 2))
    return NextResponse.json({ error: 'Failed to generate one-time payment' }, { status: 500 })
  }

  return NextResponse.json({ url: data.success_url })
}
