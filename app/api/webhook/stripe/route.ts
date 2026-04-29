import { NextResponse } from "next/server";
import crypto from "crypto";
import prismadb from "@/lib/prismadb";
import { assignPlan } from "@/lib/assign-plan";
import { addCreditsFromPack } from "@/lib/api-limit";
import { creditPackById, type CreditPackId } from "@/constants";
import { ensureUserExists } from "@/lib/ensure-user-exists";

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
  // Maps Stripe price IDs (from env vars) to SubscriptionTier.tier values in our DB.
  // DB tier values are the canonical "plan_*" form set by prisma/seed.ts.
  return {
    [process.env.STRIPE_PRICE_BEGINNER || ""]: "plan_beginner",
    [process.env.STRIPE_PRICE_BEGINNER_QUARTERLY || ""]: "plan_beginner_3month",
    [process.env.STRIPE_PRICE_STARTER || ""]: "plan_basic",
    [process.env.STRIPE_PRICE_STARTER_QUARTERLY || ""]: "plan_basic_3month",
    [process.env.STRIPE_PRICE_CREATOR || ""]: "plan_pro",
    [process.env.STRIPE_PRICE_CREATOR_QUARTERLY || ""]: "plan_pro_3month",
    [process.env.STRIPE_PRICE_STUDIO || ""]: "plan_elite",
    [process.env.STRIPE_PRICE_STUDIO_QUARTERLY || ""]: "plan_elite_3month",
    // Legacy env var names — still mapped for back-compat.
    [process.env.STRIPE_PRICE_PLAN_BASIC || ""]: "plan_basic",
    [process.env.STRIPE_PRICE_PLAN_BASIC_3MONTH || ""]: "plan_basic_3month",
    [process.env.STRIPE_PRICE_PLAN_PRO || ""]: "plan_pro",
    [process.env.STRIPE_PRICE_PLAN_PRO_3MONTH || ""]: "plan_pro_3month",
    [process.env.STRIPE_PRICE_PLAN_ELITE || ""]: "plan_elite",
    [process.env.STRIPE_PRICE_PLAN_ELITE_3MONTH || ""]: "plan_elite_3month",
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
      const metadataType = object?.metadata?.type as string | undefined;

      // Auto-create the user from Clerk if their /api/webhook/user-created hasn't
      // landed yet (race against fast checkout). Without this, every downstream
      // upsert fails with a foreign-key error and the buyer gets no credits.
      if (userId) {
        const ok = await ensureUserExists(userId);
        if (!ok) {
          console.error(
            "[STRIPE WEBHOOK] User auto-create failed; aborting checkout.session.completed",
            { userId, checkoutSessionId: object?.id }
          );
          return NextResponse.json({ error: "User not found" }, { status: 500 });
        }
      }

      // ── Credit Pack Purchase (one-time, no subscription) ──
      if (metadataType === "credit_pack" && !subscriptionId) {
        const packId = object?.metadata?.packId as CreditPackId | undefined;
        const creditsFromMeta = parseInt(object?.metadata?.credits || "0", 10);

        if (!userId) {
          console.error("[STRIPE WEBHOOK] credit_pack missing userId", {
            checkoutSessionId: object?.id,
          });
        } else if (!packId || !creditsFromMeta) {
          console.error("[STRIPE WEBHOOK] credit_pack missing packId or credits", {
            userId,
            packId,
            checkoutSessionId: object?.id,
          });
        } else {
          // Verify pack exists in our constants
          const pack = creditPackById[packId];
          const creditsToGrant = pack?.credits || creditsFromMeta;

          await addCreditsFromPack(userId, creditsToGrant);

          // Record transaction
          await prismadb.transaction.create({
            data: {
              userId,
              phyziroId: object?.id || `stripe_${Date.now()}`,
              amount: object?.amount_total ? Math.round(object.amount_total / 100) : 0,
              currency: object?.currency || "usd",
              status: "completed",
              type: "credit_pack",
              metadata: { packId, credits: creditsToGrant, source: "stripe" },
              createdAt: new Date(),
            },
          });

          console.log(
            `[STRIPE WEBHOOK] ✅ Credit pack ${packId} (${creditsToGrant} credits) granted to user ${userId}`
          );
        }
      }

      // ── Subscription Purchase ──
      else {
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
              stripePriceId: priceId ?? null,
              stripeSubscriptionId: subscriptionId ?? null,
              stripeCurrentPeriodEnd: periodEnd ?? null,
            });
          }
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
        const ok = await ensureUserExists(userId);
        if (!ok) {
          console.error("[STRIPE WEBHOOK] User auto-create failed; aborting subscription event", {
            type,
            userId,
            subscriptionId,
          });
          return NextResponse.json({ error: "User not found" }, { status: 500 });
        }

        const plan = await resolvePlanByPriceId(priceId);
        if (plan) {
          await assignPlan(userId, plan.id, {
            status: "active",
            stripePriceId: priceId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            stripeCurrentPeriodEnd: currentPeriodEnd ?? null,
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

    // invoice.paid fires on every successful charge for a subscription, including
    // renewals. We use it to refresh the user's monthly credits and extend
    // currentPeriodEnd. Note: the first invoice for a new sub also fires, but
    // checkout.session.completed has already done the work; assignPlan is
    // idempotent so this is safe.
    if (type === "invoice.paid") {
      const subscriptionId = (object?.subscription || object?.parent?.subscription_details?.subscription) as
        | string
        | undefined;
      const periodEndUnix = object?.lines?.data?.[0]?.period?.end as number | undefined;
      const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : undefined;

      if (subscriptionId) {
        const existing = await prismadb.userSubscription.findFirst({
          where: { phyziroSubscriptionId: subscriptionId },
          select: { userId: true, planId: true },
        });

        if (existing?.userId) {
          // assignPlan resets monthlyRemainingCredits and refreshes
          // availableCredit while preserving credit-pack carryover.
          await assignPlan(existing.userId, existing.planId, {
            status: "active",
            stripeCurrentPeriodEnd: periodEnd ?? null,
          });
        } else {
          console.warn("[STRIPE WEBHOOK] invoice.paid: no UserSubscription matched", {
            subscriptionId,
          });
        }
      }
    }

    // invoice.payment_failed fires when Stripe fails to collect a renewal charge.
    // We mark the subscription past_due so the app can show a banner and the
    // user can update their payment method. Stripe will keep retrying per the
    // smart-retry settings; if all retries exhaust, customer.subscription.deleted
    // will fire and downgrade them to Free.
    if (type === "invoice.payment_failed") {
      const subscriptionId = (object?.subscription || object?.parent?.subscription_details?.subscription) as
        | string
        | undefined;

      if (subscriptionId) {
        await prismadb.userSubscription
          .updateMany({
            where: { phyziroSubscriptionId: subscriptionId },
            data: { status: "past_due" },
          })
          .catch((err) => {
            console.error("[STRIPE WEBHOOK] invoice.payment_failed update error", err);
          });
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
