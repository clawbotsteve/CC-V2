import { NextResponse } from "next/server";
import crypto from "crypto";
import prismadb from "@/lib/prismadb";

function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const items = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.split("="))
      .filter((pair) => pair.length === 2)
  ) as Record<string, string>;

  const timestamp = items.t;
  const v1 = items.v1;
  if (!timestamp || !v1) return false;

  const payload = `${timestamp}.${rawBody}`;
  const digest = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(v1));
  } catch {
    return false;
  }
}

async function getFreePlanId() {
  const free = await prismadb.subscriptionTier.findUnique({ where: { tier: "plan_free" } });
  if (!free) throw new Error("plan_free tier missing");
  return free.id;
}

async function applyPlanToUser(userId: string, planId: string, stripePriceId?: string, stripeSubscriptionId?: string, stripeCustomerId?: string) {
  const plan = await prismadb.subscriptionTier.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  await prismadb.userSubscription.upsert({
    where: { userId },
    update: {
      planId,
      status: "active",
      phyziroPriceId: stripePriceId || null,
      phyziroSubscriptionId: stripeSubscriptionId || null,
      ...(stripeCustomerId ? { phyziroCurrentPeriodEnd: new Date() } : {}),
    },
    create: {
      userId,
      planId,
      status: "active",
      phyziroPriceId: stripePriceId || null,
      phyziroSubscriptionId: stripeSubscriptionId || null,
    },
  });

  await prismadb.userApiLimit.upsert({
    where: { userId },
    update: {
      availableCredit: Math.max(plan.creditsPerMonth, 0),
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableAvatarSlot: plan.maxAvatarCount,
    },
    create: {
      userId,
      availableCredit: Math.max(plan.creditsPerMonth, 0),
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableAvatarSlot: plan.maxAvatarCount,
      avatarSlotUsed: 0,
      creditUsed: 0,
    },
  });
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature || !verifyStripeSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const type = event?.type as string;
    const object = event?.data?.object || {};

    if (type === "checkout.session.completed") {
      const userId = object?.client_reference_id || object?.metadata?.userId;
      const priceId = object?.metadata?.priceId || object?.display_items?.[0]?.price?.id || undefined;
      const subscriptionId = object?.subscription || undefined;
      const customerId = object?.customer || undefined;

      if (userId) {
        const plan = priceId
          ? await prismadb.subscriptionTier.findFirst({
              where: {
                OR: [{ devPriceId: priceId }, { phyziroPriceId: priceId }],
              },
            })
          : null;

        if (plan) {
          await applyPlanToUser(userId, plan.id, priceId, subscriptionId, customerId);
        }
      }
    }

    if (type === "customer.subscription.deleted") {
      const stripeSubscriptionId = object?.id as string | undefined;
      if (stripeSubscriptionId) {
        const existing = await prismadb.userSubscription.findFirst({
          where: { phyziroSubscriptionId: stripeSubscriptionId },
        });
        if (existing) {
          const freePlanId = await getFreePlanId();
          await applyPlanToUser(existing.userId, freePlanId, undefined, undefined, undefined);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
