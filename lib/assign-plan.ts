import prismadb from "@/lib/prismadb";

export async function assignPlan(userId: string, planId: string) {
  // Fetch the subscription tier
  const plan = await prismadb.subscriptionTier.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Invalid plan ID");
  }

  // Upsert UserSubscription
  await prismadb.userSubscription.upsert({
    where: { userId },
    update: { planId },
    create: {
      userId,
      planId,
    },
  });

  // Check current availableCredit first
  const existingApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId },
  });

  const shouldAddCredit = !existingApiLimit || existingApiLimit.availableCredit <= 0;
  const monthlyRemainingCredits = existingApiLimit?.monthlyRemainingCredits || 0;
  const availableCredit = existingApiLimit?.availableCredit || 0;

  const remainingCredit = Math.max(availableCredit - monthlyRemainingCredits, 0);

  // Upsert UserApiLimit with conditional credit update
  await prismadb.userApiLimit.upsert({
    where: { userId },
    update: {
      availableCredit: shouldAddCredit ? plan.creditsPerMonth : remainingCredit,
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableAvatarSlot: plan.maxAvatarCount,
    },
    create: {
      userId,
      availableCredit: plan.creditsPerMonth,
      monthlyRemainingCredits: plan.creditsPerMonth,
      availableAvatarSlot: plan.maxAvatarCount,
    },
  });

  return { success: true };
}
