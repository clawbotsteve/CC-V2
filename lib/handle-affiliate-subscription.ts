import { subDays } from 'date-fns';
import prismadb from '@/lib/prismadb';
import { grantCredit } from '@/lib/grant-credit';

const AFFILIATE_REWARD_AMOUNT = 5.00; // $5.00
const AFFILIATE_REWARD_CREDITS = 50; // 50 credits
const AFFILIATE_COOKIE_EXPIRY_DAYS = 90;

export async function handleAffiliateSubscription(
  userId: string,
  planId: string,
  affiliateString?: string
) {
  console.log("🔍 Checking for affiliate subscription...");

  // If affiliate string is provided (from cookie), use it
  // Otherwise, check cookie from request (we'll need to pass it)
  if (!affiliateString) {
    console.log("❌ No affiliate string provided");
    return;
  }

  // Find the affiliate code owner
  const affiliateCode = await prismadb.referralCode.findUnique({
    where: { referralCode: affiliateString },
  });

  if (!affiliateCode) {
    console.log("❌ Affiliate code not found:", affiliateString);
    return;
  }

  const referrerId = affiliateCode.userId;

  // Prevent self-referral
  if (referrerId === userId) {
    console.log("⚠️ Self-referral detected. Skipping affiliate reward.");
    return;
  }

  // Check if this user already has a subscription referral from this affiliate
  const existingReferral = await prismadb.referral.findFirst({
    where: {
      referredUserId: userId,
      refereeId: referrerId,
      event: "subscription",
    },
  });

  if (existingReferral) {
    console.log("❌ User already has subscription referral from this affiliate");
    return;
  }

  // Check if affiliate cookie is still valid (within 90 days)
  // We'll check this when the cookie was set - for now, we'll assume it's valid
  // if the referral doesn't exist yet

  console.log("✅ Valid affiliate found:", referrerId);

  const tier = await prismadb.subscriptionTier.findUnique({
    where: { id: planId },
    select: { name: true },
  });

  if (!tier) {
    console.log("❌ Subscription tier not found for planId:", planId);
    return;
  }

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

  console.log("📝 Referral record created:", referral.id);

  // Create reward record
  const reward = await prismadb.referralReward.create({
    data: {
      referralId: referral.id,
      referrerId: referrerId,
      refereeId: userId,
      referrerReward: Math.round(AFFILIATE_REWARD_AMOUNT * 100), // Store in cents
      refereeReward: 0,
    },
  });

  console.log("💰 Reward record created:", reward.id);

  // Grant credits to referrer
  try {
    await grantCredit(referrerId, AFFILIATE_REWARD_CREDITS);
    console.log(`✅ Granted ${AFFILIATE_REWARD_CREDITS} credits to referrer ${referrerId}`);
  } catch (creditError) {
    console.error("❌ Failed to grant credits:", creditError);
    // Don't throw - reward record is already created
  }

  console.log("🎉 Affiliate subscription reward processed successfully");
}

