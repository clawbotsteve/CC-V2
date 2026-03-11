import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function cleanAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

function resolveStripePriceId(subscriptionId: string): string {
  if (subscriptionId?.startsWith("price_")) return subscriptionId;

  const envMap: Record<string, string | undefined> = {
    plan_basic: process.env.STRIPE_PRICE_PLAN_BASIC,
    plan_basic_3month: process.env.STRIPE_PRICE_PLAN_BASIC_3MONTH,
    plan_pro: process.env.STRIPE_PRICE_PLAN_PRO,
    plan_pro_3month: process.env.STRIPE_PRICE_PLAN_PRO_3MONTH,
    plan_elite: process.env.STRIPE_PRICE_PLAN_ELITE,
    plan_elite_3month: process.env.STRIPE_PRICE_PLAN_ELITE_3MONTH,
  };

  return envMap[subscriptionId] || subscriptionId;
}

export async function POST(req: Request) {
  try {
    const { userId: authedUserId } = await auth();
    if (!authedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, userId, subscriptionId } = await req.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
    }

    if (userId && userId !== authedUserId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 403 });
    }

    const priceId = resolveStripePriceId(subscriptionId);
    if (!priceId?.startsWith("price_")) {
      return NextResponse.json(
        { error: "Invalid Stripe price id. Configure STRIPE_PRICE_* envs or pass a Stripe price_ id." },
        { status: 400 }
      );
    }

    const appUrl = cleanAppUrl();
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${appUrl}/settings?checkout=success`);
    params.set("cancel_url", `${appUrl}/pricing?checkout=cancelled`);
    params.set("client_reference_id", authedUserId);
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[userId]", authedUserId);
    params.set("metadata[priceId]", priceId);
    if (email) params.set("customer_email", email);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const stripeData = await stripeRes.json();
    if (!stripeRes.ok || !stripeData?.url) {
      return NextResponse.json(
        { error: stripeData?.error?.message || "Failed to create Stripe checkout session" },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: stripeData.url });
  } catch (error: any) {
    console.error("[BILLING STRIPE CHECKOUT ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
