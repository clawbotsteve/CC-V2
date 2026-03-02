import { subDays } from 'date-fns';
import prismadb from '@/lib/prismadb';
import { grantCredit } from '@/lib/grant-credit';
import { ReferralCredit } from '@/constants';

export async function handleReferralSubscription(userId: string, planId: string) {
  console.log("🔍 Checking for signup referral...");

  // Step 1: Check for signup referral
  const signupReferral = await prismadb.referral.findFirst({
    where: {
      referredUserId: userId,
      event: "signup",
      createdAt: {
        gte: subDays(new Date(), 30),
      },
    },
  });

  // Step 2: Abort if there's already a subscription referral
  const hasSubscriptionReferral = await prismadb.referral.findFirst({
    where: {
      referredUserId: userId,
      event: "subscription",
    },
  });

  if (!signupReferral || hasSubscriptionReferral) {
    console.log("❌ No valid referral found or already converted to subscription.");
    return;
  }

  console.log("✅ Signup referral found:", signupReferral);

  const tier = await prismadb.subscriptionTier.findUnique({
    where: {
      id: planId,
    },
    select: {
      name: true,
      price: true,
    },
  });

  if (!tier) {
    console.log("❌ Subscription tier not found for planId:", planId);
    return;
  }

  console.log("📦 Subscription tier found:", tier);

  const rewardAmount = Math.round(tier.price * 0.15 * 10000) / 10000;;
  console.log(`💰 Calculated referrer reward (15% of $${tier.price}): $${rewardAmount}`);

  const updatedReferral = await prismadb.referral.update({
    where: {
      id: signupReferral.id,
    },
    data: {
      event: "subscription",
      planId: tier.name,
    },
  });

  console.log("🔄 Referral event updated to 'subscription':", updatedReferral);

  const reward = await prismadb.referralReward.create({
    data: {
      referralId: updatedReferral.id,
      referrerId: updatedReferral.refereeId,
      refereeId: userId,
      referrerReward: rewardAmount,
      refereeReward: ReferralCredit,
    },
  });

  console.log("🎉 Referral reward created:", reward);

  await grantCredit(userId, ReferralCredit);
  console.log(`🏆 Granted ${ReferralCredit} credits to referee (userId: ${userId})`);
}
