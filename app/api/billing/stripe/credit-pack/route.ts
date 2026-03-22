import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { creditPackById, creditToPriceId, type CreditPackId } from "@/constants";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = (await req.json()) as { packId: CreditPackId };

    const pack = creditPackById[packId];
    if (!pack) {
      return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
    }

    const stripePriceId = creditToPriceId[packId];
    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Credit pack not configured in Stripe" },
        { status: 500 }
      );
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe Checkout Session for one-time payment
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[0]", "card");
    params.append("line_items[0][price]", stripePriceId);
    params.append("line_items[0][quantity]", "1");
    params.append("client_reference_id", userId);
    params.append("metadata[userId]", userId);
    params.append("metadata[packId]", packId);
    params.append("metadata[credits]", String(pack.credits));
    params.append("metadata[type]", "credit_pack");
    params.append("success_url", `${appUrl}/settings/subscription?purchase=success`);
    params.append("cancel_url", `${appUrl}/settings/subscription?purchase=cancelled`);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await res.json();

    if (!session?.url) {
      console.error("[STRIPE CREDIT PACK] Failed to create checkout session:", session);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE CREDIT PACK ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
