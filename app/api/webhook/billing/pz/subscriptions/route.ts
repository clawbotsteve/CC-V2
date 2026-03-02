import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { updateUserApiLimit } from "@/lib/api-limit";
import { handleReferralSubscription } from "@/lib/handle-referral-subscription";
import { handleAffiliateSubscription } from "@/lib/handle-affiliate-subscription";
import { getPlanIdByTier } from "@/lib/get-plan-id-by-tier";
import { PLAN_FREE } from "@/constants";
import { getSubscriptionTierIdByPriceId } from "@/lib/get-active-tier-by-price-id";
import { SubscriptionStatus } from "@prisma/client";
import { assignPlan } from "@/lib/assign-plan";

export interface PhyziroSubscriptionWebhookPayload {
  event: "subscription.created" | "subscription.updated" | "subscription.canceled";
  data: {
    userId: string;
    subscriptionPlanId: string;
    status: SubscriptionStatus;
    currentPeriodEnd: number;
  };
}

const AUTH_TOKEN = process.env.PHYZIRRO_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    console.debug("[WEBHOOK] Auth header received:", authHeader);

    if (scheme !== "Bearer" || token !== AUTH_TOKEN) {
      console.warn("[WEBHOOK] Unauthorized: Invalid token or scheme");
      return NextResponse.json(
        { event: "unauthorized", message: "error", reason: "Invalid or missing token" },
        { status: 401 }
      );
    }

    const body: PhyziroSubscriptionWebhookPayload = await req.json();

    console.debug("[WEBHOOK] Parsed body:", JSON.stringify(body, null, 2));

    const { event: eventType, data } = body;

    if (!data?.userId) {
      console.error("[WEBHOOK] userId is missing in payload");
      return NextResponse.json(
        { event: eventType, message: "error", reason: "Missing userId" },
        { status: 400 }
      );
    }

    console.debug(`[WEBHOOK] Processing event: ${eventType} for user ${data.userId}`);

    // For subscription.updated, we should allow creating if it doesn't exist
    // For subscription.created, we might want to check if user exists in User table
    if (eventType === "subscription.created") {
      const userExists = await prismadb.user.findUnique({
        where: { userId: data.userId },
        select: { id: true },
      });

      if (!userExists) {
        console.error(`[WEBHOOK] User not found in User table for userId: ${data.userId}`);
        return NextResponse.json(
          { event: eventType, message: "error", reason: "User not found" },
          { status: 404 }
        );
      }
    }

    const planId = await getSubscriptionTierIdByPriceId(data.subscriptionPlanId);
    console.debug(`[WEBHOOK] Resolved planId: ${planId} from planCode: ${data.subscriptionPlanId}`);

    if (!planId) {
      console.error(`[WEBHOOK] Unknown plan ID: ${data.subscriptionPlanId}`);
      return NextResponse.json(
        { event: eventType, message: "error", reason: "Unknown plan code" },
        { status: 400 }
      );
    }

    switch (eventType) {
      case "subscription.created":
      case "subscription.updated": {
        const currentPeriodEnd = new Date(data.currentPeriodEnd * 1000);

        console.debug(`[WEBHOOK] Upserting subscription for user ${data.userId} with plan ${planId}`);

        await prismadb.userSubscription.upsert({
          where: { userId: data.userId },
          update: {
            phyziroSubscriptionId: data.subscriptionPlanId,
            planId,
            status: data.status,
            phyziroCurrentPeriodEnd: currentPeriodEnd,
          },
          create: {
            userId: data.userId,
            phyziroSubscriptionId: data.subscriptionPlanId,
            planId,
            status: data.status,
            phyziroCurrentPeriodEnd: currentPeriodEnd,
          },
        });

        console.debug(`[WEBHOOK] Subscription upserted. Updating API limit and referral logic...`);

        // Get plan details before updating limits
        const plan = await prismadb.subscriptionTier.findUnique({
          where: { id: planId },
        });

        if (!plan) {
          console.error(`[WEBHOOK] Plan not found for planId: ${planId}`);
          return NextResponse.json(
            { event: eventType, message: "error", reason: "Plan not found" },
            { status: 400 }
          );
        }

        try {
          await updateUserApiLimit({ userId: data.userId, planId });
        } catch (limitError: any) {
          console.error(`[WEBHOOK] Failed to update API limit:`, {
            userId: data.userId,
            planId,
            error: limitError?.message,
            stack: limitError?.stack,
          });
          throw limitError; // Re-throw to be caught by outer catch
        }

        try {
          await handleReferralSubscription(data.userId, planId);
        } catch (referralError: any) {
          // Log but don't fail the webhook if referral handling fails
          console.error(`[WEBHOOK] Failed to handle referral subscription:`, {
            userId: data.userId,
            planId,
            error: referralError?.message,
          });
        }

        // Handle affiliate subscription
        try {
          // Get user to check for affiliate code in meta
          const user = await prismadb.user.findUnique({
            where: { userId: data.userId },
            select: { meta: true },
          });

          const affiliateCode = (user?.meta as any)?.affiliateCode;
          if (affiliateCode) {
            await handleAffiliateSubscription(data.userId, planId, affiliateCode);
          }
        } catch (affiliateError: any) {
          // Log but don't fail the webhook if affiliate handling fails
          console.error(`[WEBHOOK] Failed to handle affiliate subscription:`, {
            userId: data.userId,
            planId,
            error: affiliateError?.message,
          });
        }

        // Create transaction record
        try {
          await prismadb.transaction.create({
            data: {
              userId: data.userId,
              phyziroId: data.subscriptionPlanId,
              amount: plan.price || 0,
              currency: "usd",
              status: data.status,
              type: "subscription",
              metadata: { planId, eventType, userId: data.userId },
              createdAt: new Date(),
            },
          });
        } catch (transactionError: any) {
          // Log but don't fail the webhook if transaction creation fails
          console.error(`[WEBHOOK] Failed to create transaction record:`, {
            userId: data.userId,
            error: transactionError?.message,
            code: transactionError?.code,
            meta: transactionError?.meta,
          });
        }

        console.info(`[WEBHOOK] Subscription processed successfully for user ${data.userId}`);

        return NextResponse.json(
          { event: eventType, message: "success" },
          { status: 200 }
        );
      }

      case "subscription.canceled": {
        console.debug(`[WEBHOOK] Canceling subscription for user ${data.userId}`);


        const freePlanId = await getPlanIdByTier(PLAN_FREE);
        console.debug(`[WEBHOOK] Assigning free plan (${freePlanId}) to user ${data.userId}`);

        await assignPlan(data.userId, freePlanId);

        console.info(`[WEBHOOK] Subscription canceled and user downgraded to free`);

        return NextResponse.json(
          { event: eventType, message: "success" },
          { status: 200 }
        );
      }

      default: {
        console.warn(`[WEBHOOK] Unhandled event type: ${eventType}`);
        return NextResponse.json(
          { event: eventType, message: "error", reason: "Unhandled event type" },
          { status: 400 }
        );
      }
    }
  } catch (error: any) {
    console.error("[WEBHOOK_ERROR] Full error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
      cause: error?.cause,
    });
    return NextResponse.json(
      { 
        event: "unknown", 
        message: "error", 
        reason: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
