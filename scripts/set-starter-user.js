const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/set-starter-user.js <userId>');
  process.exit(1);
}

(async () => {
  try {
    const plan = await prisma.subscriptionTier.findFirst({
      where: { tier: { in: ['plan_basic', 'plan_starter'] } },
      orderBy: { price: 'asc' },
    });

    if (!plan) throw new Error('No starter/basic plan found');

    await prisma.userSubscription.upsert({
      where: { userId },
      update: { planId: plan.id, status: 'active' },
      create: { userId, planId: plan.id, status: 'active' },
    });

    await prisma.userApiLimit.upsert({
      where: { userId },
      update: {
        availableCredit: Math.max(plan.creditsPerMonth, 200),
        monthlyRemainingCredits: plan.creditsPerMonth,
        availableAvatarSlot: plan.maxAvatarCount,
      },
      create: {
        userId,
        availableCredit: Math.max(plan.creditsPerMonth, 200),
        monthlyRemainingCredits: plan.creditsPerMonth,
        availableAvatarSlot: plan.maxAvatarCount,
        avatarSlotUsed: 0,
        creditUsed: 0,
      },
    });

    console.log(`OK ${userId} -> ${plan.tier}`);
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
