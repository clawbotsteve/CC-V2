import pLimit from 'p-limit';
import prismadb from '../lib/prismadb.js';
import { clerkClient } from '@clerk/nextjs/server';

const BATCH_SIZE = 100;
const MAX_CONCURRENT = 80;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncUsersWithSubscriptionsBatch() {
  let skip = 0;
  let totalInserted = 0;
  const limit = pLimit(MAX_CONCURRENT);

  while (true) {
    console.log(`Fetching UserSubscription batch with skip=${skip}, take=${BATCH_SIZE}`);

    const subUsersBatch = await prismadb.userSubscription.findMany({
      skip,
      take: BATCH_SIZE,
      select: { userId: true },
    });

    if (subUsersBatch.length === 0) {
      console.log('No more UserSubscription records to process, exiting loop.');
      break;
    }

    const batchUserIds = subUsersBatch.map((u) => u.userId);

    const existingUsers = await prismadb.user.findMany({
      where: { userId: { in: batchUserIds } },
      select: { userId: true },
    });

    const existingUserIds = new Set(existingUsers.map((u) => u.userId));
    const missingUserIds = batchUserIds.filter((id) => !existingUserIds.has(id));

    if (missingUserIds.length === 0) {
      console.log(`No missing users in batch at offset ${skip}, skipping to next batch.`);
      skip += BATCH_SIZE;
      continue;
    }

    const client = await clerkClient();

    // Use p-limit to control concurrency of Clerk fetches
    const promises = missingUserIds.map(userId =>
      limit(async () => {
        try {
          const clerkUser = await client.users.getUser(userId);
          const firstName = clerkUser.firstName ?? '';
          const lastName = clerkUser.lastName ?? '';
          const name = `${firstName} ${lastName}`.trim();
          const imageUrl = clerkUser.imageUrl ?? '';

          console.log(`Fetched Clerk user: ${userId}, name: "${name}"`);
          return { userId, name, imageUrl, referralCode: '' };
        } catch (error) {
          console.error(`Failed to fetch Clerk user ${userId}:`, error);
          return { userId, name: '', imageUrl: '', referralCode: '' };
        }
      })
    );

    const newUsersData = await Promise.all(promises);

    console.log(`Inserting ${newUsersData.length} new users into DB...`);

    await prismadb.user.createMany({
      data: newUsersData,
      skipDuplicates: true,
    });

    totalInserted += newUsersData.length;
    console.log(`Inserted ${newUsersData.length} users in batch at offset ${skip}`);

    skip += BATCH_SIZE;

    // Optional delay between batches
    await sleep(2000);
  }

  console.log(`Sync completed. Total new users inserted: ${totalInserted}`);
}

syncUsersWithSubscriptionsBatch()
  .catch(console.error)
  .finally(async () => {
    await prismadb.$disconnect();
    console.log('Disconnected from database.');
  });
