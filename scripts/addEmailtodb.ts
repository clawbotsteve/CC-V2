import prismadb from '../lib/prismadb.js';
import { clerkClient } from '@clerk/nextjs/server';
import pLimit from 'p-limit';

const BATCH_SIZE = 100;
const MAX_CONCURRENT = 80;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateEmailsBatch() {
  let skip = 0;
  const limit = pLimit(MAX_CONCURRENT);

  while (true) {
    console.log(`Fetching user batch with skip=${skip}, take=${BATCH_SIZE}`);

    const users = await prismadb.user.findMany({
      skip,
      take: BATCH_SIZE,
    });

    if (users.length === 0) {
      console.log('No more users to process, exiting loop.');
      break;
    }

    // Use p-limit to limit concurrency of Clerk API calls
    const client = await clerkClient();
    const clerkUsers = await Promise.all(
      users.map(user =>
        limit(async () => {
          try {
            const clerkUser = await client.users.getUser(user.userId);
            return {
              userId: user.userId,
              email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
            };
          } catch (error) {
            console.error(`Error fetching Clerk user ${user.userId}:`, error);
            return { userId: user.userId, email: null };
          }
        })
      )
    );

    // Update emails in DB in parallel but with concurrency limit for DB if needed
    // For simplicity, updating sequentially here is okay but slower
    for (const { userId, email } of clerkUsers) {
      if (email) {
        try {
          await prismadb.user.update({
            where: { userId: userId },
            data: { email },
          });
          console.log(`Updated user ${userId} with email ${email}`);
        } catch (err) {
          console.error(`Failed to update user ${userId} email:`, err);
        }
      } else {
        console.log(`No email to update for user ${userId}`);
      }
    }

    skip += BATCH_SIZE;

    // Delay between batches to avoid flooding Clerk or DB
    await sleep(2000);
  }

  await prismadb.$disconnect();
  console.log('Finished updating emails batch.');
}

updateEmailsBatch()
  .catch((err) => {
    console.error('Error updating emails:', err);
    prismadb.$disconnect();
  });
