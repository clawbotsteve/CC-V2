import prismadb from "@/lib/prismadb";
import { SubscriptionStatus } from "@prisma/client";

export type AssignPlanOptions = {
  status?: SubscriptionStatus;
  // Legacy names kept for compatibility.
  phyziroPriceId?: string | null;
  phyziroSubscriptionId?: string | null;
  phyziroCurrentPeriodEnd?: Date | null;
  // Stripe-native names.
  stripePriceId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
};

export async function assignPlan(userId: string, planId: string, options: AssignPlanOptions = {}) {
  const {
    status,
    phyziroPriceId,
    phyziroSubscriptionId,
    phyziroCurrentPeriodEnd,
    stripePriceId,
    stripeSubscriptionId,
    stripeCurrentPeriodEnd,
  } = options;

  const resolvedPriceId = stripePriceId ?? phyziroPriceId;
  const resolvedSubscriptionId = stripeSubscriptionId ?? phyziroSubscriptionId;
  const resolvedCurrentPeriodEnd = stripeCurrentPeriodEnd ?? phyziroCurrentPeriodEnd;

  // Fetch the subscription tier
  const plan = await prismadb.subscriptionTier.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Invalid plan ID");
  }

  const subscriptionUpdateData: any = { planId };
  const subscriptionCreateData: any = { userId, planId };

  if (status !== undefined) {
    subscriptionUpdateData.status = status;
    subscriptionCreateData.status = status;
  }
  if (resolvedPriceId !== undefined) {
    subscriptionUpdateData.phyziroPriceId = resolvedPriceId;
    subscriptionCreateData.phyziroPriceId = resolvedPriceId;
    subscriptionUpdateData.stripePriceId = resolvedPriceId;
    subscriptionCreateData.stripePriceId = resolvedPriceId;
  }
  if (resolvedSubscriptionId !== undefined) {
    subscriptionUpdateData.phyziroSubscriptionId = resolvedSubscriptionId;
    subscriptionCreateData.phyziroSubscriptionId = resolvedSubscriptionId;
    subscriptionUpdateData.stripeSubscriptionId = resolvedSubscriptionId;
    subscriptionCreateData.stripeSubscriptionId = resolvedSubscriptionId;
  }
  if (resolvedCurrentPeriodEnd !== undefined) {
    subscriptionUpdateData.phyziroCurrentPeriodEnd = resolvedCurrentPeriodEnd;
    subscriptionCreateData.phyziroCurrentPeriodEnd = resolvedCurrentPeriodEnd;
    subscriptionUpdateData.stripeCurrentPeriodEnd = resolvedCurrentPeriodEnd;
    subscriptionCreateData.stripeCurrentPeriodEnd = resolvedCurrentPeriodEnd;
  }

  // Upsert UserSubscription
  await prismadb.userSubscription.upsert({
    where: { userId },
    update: subscriptionUpdateData,
    create: subscriptionCreateData,
  });

  const existingApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId },
  });

  const monthlyRemainingCredits = existingApiLimit?.monthlyRemainingCredits || 0;
  const availableCredit = existingApiLimit?.availableCredit || 0;

  // Preserve non-monthly leftover credits (e.g., purchased packs), then add refreshed monthly credits.
  const carryOverCredits = Math.max(availableCredit - monthlyRemainingCredits, 0);

  await prismadb.userApiLimit.upsert({
    where: { userId },
    update: {
      availableCredit: carryOverCredits + plan.creditsPerMonth,
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableAvatarSlot: plan.maxAvatarCount,
    },
    create: {
      userId,
      availableCredit: plan.creditsPerMonth,
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableAvatarSlot: plan.maxAvatarCount,
      avatarSlotUsed: 0,
      creditUsed: 0,
    },
  });

  return { success: true };
}
