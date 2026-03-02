const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userId = process.argv[2];
const tierArg = process.argv[3];

if (!userId || !tierArg) {
  console.error('Usage: node scripts/set-user-tier.js <userId> <tier>');
  process.exit(1);
}

const TIER_ALIASES = {
  free: ['plan_free'],
  starter: ['plan_starter', 'plan_basic'],
  creator: ['plan_creator', 'plan_pro'],
  studio: ['plan_studio', 'plan_elite'],
};

(async () => {
  try {
    const candidates = TIER_ALIASES[tierArg.toLowerCase()] || [tierArg];

    let plan = await prisma.subscriptionTier.findFirst({
      where: { tier: { in: candidates } },
      orderBy: { price: 'asc' },
    });

    if (!plan) {
      const defaults = {
        plan_creator: { name: 'Creator Plan', price: 49.99, creditsPerMonth: 600, maxAvatarCount: 3 },
        plan_starter: { name: 'Starter Plan', price: 19.99, creditsPerMonth: 200, maxAvatarCount: 1 },
        plan_free: { name: 'Free Plan', price: 0, creditsPerMonth: 5, maxAvatarCount: 0 },
        plan_studio: { name: 'Studio Plan', price: 149.99, creditsPerMonth: 2000, maxAvatarCount: 10 },
      };
      const tierToCreate = candidates[0];
      const d = defaults[tierToCreate];
      if (!d) throw new Error(`No tier found or default template for: ${tierArg}`);

      plan = await prisma.subscriptionTier.create({
        data: {
          name: d.name,
          tier: tierToCreate,
          price: d.price,
          period: 'monthly',
          creditsPerMonth: d.creditsPerMonth,
          speed: 'standard',
          support: 'community_email',
          maxAvatarCount: d.maxAvatarCount,
          devPriceId: '',
          phyziroPriceId: '',
          status: 'active',
        },
      });
    }

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
