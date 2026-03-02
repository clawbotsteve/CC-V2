import { auth } from "@clerk/nextjs/server";

import prismadb from "@/lib/prismadb";
import { MAX_FREE_COUNTS, ReferralCredit } from "@/constants";

import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient();

export const incrementApiLimit = async () => {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId: userId },
  });

  if (userApiLimit) {
    await prismadb.userApiLimit.update({
      where: { userId: userId },
      data: { availableCredit: userApiLimit.availableCredit + 1 },
    });
  } else {
    await prismadb.userApiLimit.create({
      data: { userId: userId, availableCredit: 1 },
    });
  }
};

export const checkApiLimit = async () => {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId: userId },
  });

  if (!userApiLimit || userApiLimit.availableCredit < MAX_FREE_COUNTS) {
    return true;
  } else {
    return false;
  }
};

export const getApiLimitCount = async () => {
  const { userId } = await auth();

  if (!userId) {
    return 0;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: {
      userId,
    },
  });

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.availableCredit;
};


/**
 * Updates the user's API limits based on the new subscription plan.
 *
 * ⚙️ This function:
 * - Keeps any existing available credit (e.g. from referral, previous plan, signup, etc.)
 * - Adds the new plan's monthly credit on top
 * - Resets the used credit counter
 * - Sets avatar slot limits based on the plan
 *
 * 📌 This function does NOT:
 * - Grant signup or referral credits
 * - Handle billing or subscription cancellation logic
 *
 * Use this for:
 * - Plan upgrades/downgrades
 * - Monthly billing cycle refresh
 */
export async function updateUserApiLimit({ userId, planId }: UpdateLimitOptions) {
  const [existing, plan] = await Promise.all([
    prisma.userApiLimit.findUnique({ where: { userId } }),
    prisma.subscriptionTier.findUnique({ where: { id: planId } }),
  ]);

  if (!plan) {
    throw new Error(`❌ Invalid planId: ${planId}`);
  }

  // Calculate permanent credits (existing total - existing monthly)
  const existingTotal = existing?.availableCredit ?? 0;
  const existingMonthly = existing?.monthlyRemainingCredits ?? 0;
  const permanentCredits = Math.max(0, existingTotal - existingMonthly);

  const newTotal = plan.creditsPerMonth + permanentCredits;

  await prisma.userApiLimit.upsert({
    where: { userId },
    update: {
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableCredit: newTotal,
      creditUsed: 0,
      availableAvatarSlot: plan.maxAvatarCount,
      avatarSlotUsed: existing?.avatarSlotUsed ?? 0,
    },
    create: {
      userId,
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableCredit: plan.creditsPerMonth,
      creditUsed: 0,
      availableAvatarSlot: plan.maxAvatarCount,
      avatarSlotUsed: 0,
    },
  });

  console.log(`[LIMIT SYNC] ✅ User ${userId} → Plan ${plan.tier} → Total: ${newTotal} (Monthly: ${plan.creditsPerMonth}, Permanent: ${permanentCredits}), Slots: ${plan.maxAvatarCount}`);
}


export async function addCreditsFromPack(userId: string, credits: number) {
  const existing = await prisma.userApiLimit.findUnique({ where: { userId } });

  const updatedCredits = (existing?.availableCredit || 0) + credits;

  await prisma.userApiLimit.upsert({
    where: { userId },
    update: {
      availableCredit: updatedCredits,
    },
    create: {
      userId,
      availableCredit: credits,
      monthlyRemainingCredits: 0,
      creditUsed: 0,
      availableAvatarSlot: 1,
      avatarSlotUsed: 0,
    },
  });

  console.log(`[CREDIT_PURCHASE] ✅ Added ${credits} credits to user: ${userId}`);
}


type UpdateLimitOptions = {
  userId: string;
  planId: string;
};
