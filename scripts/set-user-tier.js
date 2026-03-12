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

    // Safer lookup across mixed schemas/environments.
    let plan = null;
    for (const t of candidates) {
      plan = await prisma.subscriptionTier.findFirst({ where: { tier: t } });
      if (plan) break;
    }

    if (!plan) {
      const defaults = {
        plan_creator: { name: 'Creator Plan', price: 49.99, creditsPerMonth: 600, maxAvatarCount: 3 },
        plan_starter: { name: 'Starter Plan', price: 19.99, creditsPerMonth: 200, maxAvatarCount: 1 },
        plan_free: { name: 'Free Plan', price: 0, creditsPerMonth: 5, maxAvatarCount: 0 },
        plan_studio: { name: 'Studio Plan', price: 149.99, creditsPerMonth: 2000, maxAvatarCount: 10 },
      };

      // Canonical tier creation target (creator/starter/free/studio)
      const canonical =
        candidates.includes('plan_creator') ? 'plan_creator' :
        candidates.includes('plan_starter') ? 'plan_starter' :
        candidates.includes('plan_free') ? 'plan_free' :
        candidates.includes('plan_studio') ? 'plan_studio' :
        candidates[0];

      const d = defaults[canonical];
      if (!d) throw new Error(`No tier found or default template for: ${tierArg}`);

      const existingCanonical = await prisma.subscriptionTier.findFirst({ where: { tier: canonical } });
      if (existingCanonical) {
        plan = await prisma.subscriptionTier.update({
          where: { id: existingCanonical.id },
          data: {
            name: d.name,
            price: d.price,
            creditsPerMonth: d.creditsPerMonth,
            maxAvatarCount: d.maxAvatarCount,
            status: 'active',
          },
        });
      } else {
        plan = await prisma.subscriptionTier.create({
          data: {
            name: d.name,
            tier: canonical,
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
