// app/api/extend-subscriptions/route.ts

import { NextResponse } from 'next/server';
import { addDays } from 'date-fns';
import prismadb from '@/lib/prismadb';
import novu from '@/lib/novu';

const BATCH_SIZE = 100;

export async function POST() {
  let skip = 0;
  let hasMore = true;

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  const failureDetails: { userId: string; error: any }[] = [];

  while (hasMore) {
    console.log(`⏳ Fetching batch of users, skip=${skip}, take=${BATCH_SIZE}...`);

    const users = await prismadb.userSubscription.findMany({
      where: {
        phyziroCurrentPeriodEnd: {
          gt: new Date(),
        },
      },
      take: BATCH_SIZE,
      skip,
    });

    if (users.length === 0) {
      hasMore = false;
      console.log('🚫 No more users to process.');
      break;
    }

    console.log(`⚙️ Processing batch of ${users.length} users...`);

    const batchResults = await Promise.allSettled(
      users.map(async (user) => {
        const newEndDate = addDays(user.phyziroCurrentPeriodEnd!, 3);

        await prismadb.userSubscription.update({
          where: { id: user.id },
          data: { phyziroCurrentPeriodEnd: newEndDate },
        });

        await novu.trigger({
          workflowId: 'extra-days-compensation',
          to: { subscriberId: user.userId },
          payload: {
            daysAdded: 3,
            newPeriodEnd: newEndDate.toISOString(),
          },
        });

        return user.userId;
      })
    );

    batchResults.forEach((result, index) => {
      totalProcessed++;
      if (result.status === 'fulfilled') {
        totalSuccess++;
        console.log(`✅ Successfully processed user ${result.value}`);
      } else {
        totalFailed++;
        failureDetails.push({ userId: users[index].userId, error: result.reason });
        console.error(`❌ Failed for user ${users[index].userId}:`, result.reason);
      }
    });

    skip += BATCH_SIZE;
  }

  console.log('🎉 All done.');
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Successes: ${totalSuccess}`);
  console.log(`Failures: ${totalFailed}`);

  return NextResponse.json({
    message: 'Extend subscriptions and notify completed.',
    totalProcessed,
    totalSuccess,
    totalFailed,
    failureDetails,
  });
}
