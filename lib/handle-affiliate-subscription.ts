import prismadb from '@/lib/prismadb';
import { grantCredit } from '@/lib/grant-credit';

const AFFILIATE_REWARD_CREDITS = 50;

export async function handleAffiliateSubscription(
  userId: string,
  planId: string,
  affiliateString?: string
) {
  console.log("[Affiliate] Checking for affiliate subscription...");

  if (!affiliateString) {
    console.log("[Affiliate] No affiliate string provided");
    return;
  }

  // Find the affiliate record (with configurable commission)
  const affiliate = await prismadb.affiliate.findUnique({
    where: { affiliateCode: affiliateString },
  });

  // Fall back to ReferralCode if no Affiliate record exists yet
  const affiliateCode = affiliate
    ? { userId: affiliate.userId }
    : await prismadb.referralCode.findUnique({
        where: { referralCode: affiliateString },
      });

  if (!affiliateCode) {
    console.log("[Affiliate] Code not found:", affiliateString);
    return;
  }

  const referrerId = affiliateCode.userId;

  // Prevent self-referral
  if (referrerId === userId) {
    console.log("[Affiliate] Self-referral detected. Skipping.");
    return;
  }

  // Check affiliate status
  if (affiliate && affiliate.status !== "active") {
    console.log("[Affiliate] Affiliate is not active:", affiliate.status);
    return;
  }

  // Check for existing subscription referral from this affiliate
  const existingReferral = await prismadb.referral.findFirst({
    where: {
      referredUserId: userId,
      refereeId: referrerId,
      event: "subscription",
    },
  });

  if (existingReferral) {
    console.log("[Affiliate] User already has subscription referral from this affiliate");
    return;
  }

  // Get the subscription tier to calculate commission
  const tier = await prismadb.subscriptionTier.findUnique({
    where: { id: planId },
    select: { name: true, price: true },
  });

  if (!tier) {
    console.log("[Affiliate] Subscription tier not found for planId:", planId);
    return;
  }

  // Calculate commission based on affiliate settings or defaults
  let rewardAmountDollars: number;
  const commissionType = affiliate?.commissionType ?? "percentage";
  const commissionRate = affiliate?.commissionRate ?? 15.0;

  if (commissionType === "percentage") {
    rewardAmountDollars = tier.price * (commissionRate / 100);
  } else {
    rewardAmountDollars = commissionRate;
  }

  const rewardAmountCents = Math.round(rewardAmountDollars * 100);

  console.log(
    `[Affiliate] Commission: ${commissionType} @ ${commissionRate} on $${tier.price} = $${rewardAmountDollars.toFixed(2)}`
  );

  // Create referral record
  const referral = await prismadb.referral.create({
    data: {
      refereeId: referrerId,
      referredUserId: userId,
      referralCode: affiliateString,
      event: "subscription",
      planId: tier.name,
    },
  });

  // Create reward record
  await prismadb.referralReward.create({
    data: {
      referralId: referral.id,
      referrerId: referrerId,
      refereeId: userId,
      referrerReward: rewardAmountCents,
      refereeReward: 0,
    },
  });

  // Update affiliate balances if Affiliate record exists
  if (affiliate) {
    await prismadb.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalEarnings: { increment: rewardAmountDollars },
        pendingBalance: { increment: rewardAmountDollars },
      },
    });
  }

  // Grant credits to referrer
  try {
    await grantCredit(referrerId, AFFILIATE_REWARD_CREDITS);
    console.log(`[Affiliate] Granted ${AFFILIATE_REWARD_CREDITS} credits to referrer ${referrerId}`);
  } catch (creditError) {
    console.error("[Affiliate] Failed to grant credits:", creditError);
  }

  console.log("[Affiliate] Subscription reward processed successfully");
}
