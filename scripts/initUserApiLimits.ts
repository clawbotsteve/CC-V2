import prismadb from "../lib/prismadb";

async function main() {
  const subscriptions = await prismadb.userSubscription.findMany({
    include: {
      plan: true,
    },
  });

  console.log(`🔍 Found ${subscriptions.length} user subscriptions`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const sub of subscriptions) {
    const exists = await prismadb.userApiLimit.findUnique({
      where: { userId: sub.userId },
    });

    if (exists) {
      console.log(`⏩ Skipped: User ${sub.userId} already has UserApiLimit`);
      skippedCount++;
      continue;
    }

    await prismadb.userApiLimit.create({
      data: {
        userId: sub.userId,
        availableCredit: sub.plan.creditsPerMonth,
        availableAvatarSlot: sub.plan.maxAvatarCount,
      },
    });

    console.log(
      `✅ Created UserApiLimit for user ${sub.userId} → ${sub.plan.creditsPerMonth} credits, ${sub.plan.maxAvatarCount} avatar slots`
    );
    createdCount++;
  }

  console.log(`\n✅ Done! Created: ${createdCount}, Skipped: ${skippedCount}`);
}

main()
  .catch((err) => {
    console.error("❌ Error during script execution:", err);
    process.exit(1);
  })
  .finally(() => prismadb.$disconnect());
