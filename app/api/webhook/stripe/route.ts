import { NextResponse } from "next/server";
import crypto from "crypto";
import prismadb from "@/lib/prismadb";
import { assignPlan } from "@/lib/assign-plan";

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

function envPriceTierMap(): Record<string, string> {
  return {
    [process.env.STRIPE_PRICE_STARTER || ""]: "starter",
    [process.env.STRIPE_PRICE_STARTER_QUARTERLY || ""]: "starter_quarterly",
    [process.env.STRIPE_PRICE_CREATOR || ""]: "creator",
    [process.env.STRIPE_PRICE_CREATOR_QUARTERLY || ""]: "creator_quarterly",
    [process.env.STRIPE_PRICE_STUDIO || ""]: "studio",
    [process.env.STRIPE_PRICE_STUDIO_QUARTERLY || ""]: "studio_quarterly",
    [process.env.STRIPE_PRICE_PLAN_BASIC || ""]: "starter",
    [process.env.STRIPE_PRICE_PLAN_BASIC_3MONTH || ""]: "starter_quarterly",
    [process.env.STRIPE_PRICE_PLAN_PRO || ""]: "creator",
    [process.env.STRIPE_PRICE_PLAN_PRO_3MONTH || ""]: "creator_quarterly",
    [process.env.STRIPE_PRICE_PLAN_ELITE || ""]: "studio",
    [process.env.STRIPE_PRICE_PLAN_ELITE_3MONTH || ""]: "studio_quarterly",
  };
}

async function resolvePlanByPriceId(priceId?: string | null) {
  if (!priceId) return null;

  const direct = await prismadb.subscriptionTier.findFirst({
    where: {
      OR: [{ devPriceId: priceId }, { phyziroPriceId: priceId }],
    },
  });
  if (direct) return direct;

  const mappedTier = envPriceTierMap()[priceId];
  if (!mappedTier) return null;

  return prismadb.subscriptionTier.findUnique({ where: { tier: mappedTier } });
}

async function getFreePlanId() {
  const free = await prismadb.subscriptionTier.findUnique({ where: { tier: "plan_free" } });
  if (!free) throw new Error("plan_free tier missing");
  return free.id;
}

async function fetchStripeSubscription(subscriptionId: string) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  if (!stripeSecret) return null;

  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) return null;
  return res.json();
}

function extractPriceIdFromCheckoutSession(session: any): string | undefined {
  return (
    session?.metadata?.priceId ||
    session?.line_items?.data?.[0]?.price?.id ||
    session?.display_items?.[0]?.price?.id ||
    undefined
  );
}

async function applyPlanToUser(params: {
  userId: string;
  planId: string;
  stripePriceId?: string;
  stripeSubscriptionId?: string;
  stripeCurrentPeriodEnd?: Date;
}) {
  const { userId, planId, stripePriceId, stripeSubscriptionId, stripeCurrentPeriodEnd } = params;

  const plan = await prismadb.subscriptionTier.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  await prismadb.userSubscription.upsert({
    where: { userId },
    update: {
      planId,
      status: "active",
      phyziroPriceId: stripePriceId || null,
      phyziroSubscriptionId: stripeSubscriptionId || null,
      phyziroCurrentPeriodEnd: stripeCurrentPeriodEnd ?? null,
    },
    create: {
      userId,
      planId,
      status: "active",
      phyziroPriceId: stripePriceId || null,
      phyziroSubscriptionId: stripeSubscriptionId || null,
      phyziroCurrentPeriodEnd: stripeCurrentPeriodEnd ?? null,
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
      const subscriptionId = object?.subscription || undefined;
      let priceId = extractPriceIdFromCheckoutSession(object);
      let periodEnd: Date | undefined;

      if (subscriptionId && (!priceId || !userId)) {
        const sub = await fetchStripeSubscription(subscriptionId);
        priceId = priceId || sub?.items?.data?.[0]?.price?.id;
        periodEnd = sub?.current_period_end ? new Date(sub.current_period_end * 1000) : undefined;
      }

      if (!userId) {
        console.error("[STRIPE WEBHOOK] checkout.session.completed missing userId", {
          checkoutSessionId: object?.id,
          subscriptionId,
        });
      } else {
        const plan = await resolvePlanByPriceId(priceId);

        if (!plan) {
          console.error("[STRIPE WEBHOOK] Unable to resolve plan from priceId", {
            userId,
            priceId,
            checkoutSessionId: object?.id,
          });
        } else {
          await assignPlan(userId, plan.id, {
            status: "active",
            phyziroPriceId: priceId ?? null,
            phyziroSubscriptionId: subscriptionId ?? null,
            phyziroCurrentPeriodEnd: periodEnd ?? null,
          });
        }
      }
    }

    if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
      const subscriptionId = object?.id as string | undefined;
      const priceId = object?.items?.data?.[0]?.price?.id as string | undefined;
      const currentPeriodEnd = object?.current_period_end
        ? new Date(object.current_period_end * 1000)
        : undefined;

      let userId = object?.metadata?.userId as string | undefined;
      if (!userId && subscriptionId) {
        const existing = await prismadb.userSubscription.findFirst({
          where: { phyziroSubscriptionId: subscriptionId },
          select: { userId: true },
        });
        userId = existing?.userId;
      }

      if (userId) {
        const plan = await resolvePlanByPriceId(priceId);
        if (plan) {
          await assignPlan(userId, plan.id, {
            status: "active",
            phyziroPriceId: priceId ?? null,
            phyziroSubscriptionId: subscriptionId ?? null,
            phyziroCurrentPeriodEnd: currentPeriodEnd ?? null,
          });
        } else {
          console.error("[STRIPE WEBHOOK] subscription event could not resolve plan", {
            type,
            userId,
            priceId,
            subscriptionId,
          });
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
          await assignPlan(existing.userId, freePlanId, {
            status: "canceled",
            phyziroPriceId: null,
            phyziroSubscriptionId: null,
            phyziroCurrentPeriodEnd: null,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
