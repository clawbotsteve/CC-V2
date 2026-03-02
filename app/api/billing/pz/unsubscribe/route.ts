import { NextResponse } from 'next/server'

const ELECTRYT_API_URL = 'https://phyziro.com/chain/electryt/router.php'
//test
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
  const { userId, userSubscriptionId, subscriptionPlanId } = await req.json()
  console.log("🔍 userId:", userId);
  console.log("🔍 userSubscriptionId:", userSubscriptionId);
  console.log("🔍 subscriptionPlanId:", subscriptionPlanId);

  if (!subscriptionPlanId || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const body = [
    {
      referrer: {
        network: 'external',
        type: 'website',
      },
      request: [
        {
          task: 'update.subscriber',
          auth: 'no_auth',
          mount: {
            experiment: false,
            virtuality: 'self-hosted',
            multi_task: [],
            app: { id: process.env.ELECTRYT_APP_ID },
            subscriber: {
              id: "",
              'external-id': userId,
              subscription_id: subscriptionPlanId,
              isSubbed: "false",
              isTestUser: "false",
              trialDays: 0,
              trialBillingCycles: 0,
            },
          },
        },
      ],
    },
  ]

  const unsubRes = await fetch(ELECTRYT_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const unsubData = await unsubRes.json();

  if (!unsubRes.ok || unsubData.result !== 'successfully updated') {
    return NextResponse.json(
      {
        error: 'Failed to unsubscribe',
        details: unsubData,
      },
      { status: 400 }
    );
  }

  // Note: The actual subscription deletion and free plan assignment
  // will be handled by the webhook when Phyziro confirms the cancellation
  return NextResponse.json({
    success: true,
    message: 'Unsubscribe request sent to Phyziro. Your subscription will be canceled shortly.',
    externalId: unsubData.external_id,
    subscriptionPlanId: unsubData.sub_id,
  });
}
