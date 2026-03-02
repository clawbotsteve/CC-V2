import prismadb from '../lib/prismadb.js'
import pLimit from 'p-limit'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function updateUserSubscriptionCreatedAtBatch(batchSize = 500, concurrency = 10) {
  let skip = 0
  const limit = pLimit(concurrency)

  while (true) {
    console.log(`Fetching batch: skip=${skip} limit=${batchSize}`)
    const limits = await prismadb.userApiLimit.findMany({
      skip,
      take: batchSize,
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    if (limits.length === 0) {
      console.log('No more records to process. Exiting.')
      break
    }

    // Use p-limit to run up to `concurrency` promises at once
    await Promise.all(
      limits.map(({ userId, createdAt }) =>
        limit(async () => {
          try {
            const updated = await prismadb.userSubscription.updateMany({
              where: { userId },
              data: { createdAt },
            })
            if (updated.count > 0) {
              console.log(`Updated userSubscription for userId=${userId}`)
            } else {
              console.log(`No userSubscription found for userId=${userId}`)
            }
          } catch (err) {
            console.error(`Error updating userId=${userId}:`, err)
          }
        })
      )
    )

    skip += batchSize

    console.log('Batch processed, waiting 2 seconds before next batch...')
    await sleep(2000)
  }
}

updateUserSubscriptionCreatedAtBatch()
  .then(() => {
    console.log('Update complete.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Script failed:', err)
    process.exit(1)
  })
