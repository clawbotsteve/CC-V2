import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

function cleanAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

async function resolveStripePriceId(subscriptionId: string): Promise<string> {
  if (subscriptionId?.startsWith("price_")) return subscriptionId;

  const envMap: Record<string, string | undefined> = {
    // Legacy/internal keys
    plan_basic: process.env.STRIPE_PRICE_PLAN_BASIC || process.env.STRIPE_PRICE_STARTER,
    plan_basic_3month:
      process.env.STRIPE_PRICE_PLAN_BASIC_3MONTH || process.env.STRIPE_PRICE_STARTER_QUARTERLY,
    plan_pro: process.env.STRIPE_PRICE_PLAN_PRO || process.env.STRIPE_PRICE_CREATOR,
    plan_pro_3month:
      process.env.STRIPE_PRICE_PLAN_PRO_3MONTH || process.env.STRIPE_PRICE_CREATOR_QUARTERLY,
    plan_elite: process.env.STRIPE_PRICE_PLAN_ELITE || process.env.STRIPE_PRICE_STUDIO,
    plan_elite_3month:
      process.env.STRIPE_PRICE_PLAN_ELITE_3MONTH || process.env.STRIPE_PRICE_STUDIO_QUARTERLY,

    // Friendly plan keys (preferred)
    starter: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_PLAN_BASIC,
    starter_quarterly:
      process.env.STRIPE_PRICE_STARTER_QUARTERLY || process.env.STRIPE_PRICE_PLAN_BASIC_3MONTH,
    creator: process.env.STRIPE_PRICE_CREATOR || process.env.STRIPE_PRICE_PLAN_PRO,
    creator_quarterly:
      process.env.STRIPE_PRICE_CREATOR_QUARTERLY || process.env.STRIPE_PRICE_PLAN_PRO_3MONTH,
    studio: process.env.STRIPE_PRICE_STUDIO || process.env.STRIPE_PRICE_PLAN_ELITE,
    studio_quarterly:
      process.env.STRIPE_PRICE_STUDIO_QUARTERLY || process.env.STRIPE_PRICE_PLAN_ELITE_3MONTH,
  };

  if (envMap[subscriptionId]) return envMap[subscriptionId]!;

  // Backward compatibility: some payloads send legacy subscription/product ids.
  const tier = await prismadb.subscriptionTier.findFirst({
    where: {
      OR: [{ devPriceId: subscriptionId }, { phyziroPriceId: subscriptionId }, { tier: subscriptionId }],
    },
    select: { tier: true },
  });

  if (tier?.tier) {
    const fromTier = envMap[tier.tier];
    if (fromTier) return fromTier;
  }

  return subscriptionId;
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

    const priceId = await resolveStripePriceId(subscriptionId);
    if (!priceId?.startsWith("price_")) {
      return NextResponse.json(
        { error: "Invalid Stripe price id. Configure STRIPE_PRICE_* envs or pass a Stripe price_ id." },
        { status: 400 }
      );
    }

    const appUrl = cleanAppUrl();

    // Dashboard pricing cards should route users to the canonical /pricing page first.
    const referer = req.headers.get("referer") || "";
    if (referer.includes("/dashboard")) {
      return NextResponse.json({ url: `${appUrl}/pricing` });
    }

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

    const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: "Missing Stripe secret key in env" }, { status: 400 });
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
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
