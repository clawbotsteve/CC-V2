import { auth } from "@clerk/nextjs/server";

import prismadb from "@/lib/prismadb";

const DAY_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const userSubscription = await prismadb.userSubscription.findUnique({
    where: {
      userId: userId,
    },
    select: {
      phyziroCurrentPeriodEnd: true,
      phyziroSubscriptionId: true,
    },
  });

  if (!userSubscription) {
    return false;
  }

  const isValid =
    userSubscription.phyziroSubscriptionId &&
    userSubscription.phyziroCurrentPeriodEnd !== null &&
    userSubscription.phyziroCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();


  return !!isValid;
};


export type SubscriptionInfo = {
  planName: string;
  price: string;
  startDate: Date;
  nextBillingDate: Date;
  status: string;
};


// export const getSubscriptionInfo = async (): Promise<SubscriptionInfo | null> => {
//   const { userId } = await auth();

//   if (!userId) return null;
//   const dbSub = await prismadb.userSubscription.findUnique({
//     where: { userId },
//   });

//   if (!dbSub?.phyziroSubscriptionId) return null;

//   const phyziroSub = await phyziro.subscriptions.retrieve(dbSub.phyziroSubscriptionId);

//   const item = phyziroSub.items.data[0];
//   const subscription = await prismadb.userSubscription.findUnique({
//     where: { userId },
//     include: {
//       plan: true,
//     },
//   });

//   const planName = subscription?.plan.tier || "Free";
//   const price = `$${(item.price.unit_amount || 0) / 100}/${item.price.recurring?.interval || "mo"}`;
//   const startDate = new Date(phyziroSub.start_date * 1000);
//   const nextBillingDate = new Date(phyziroSub.items.data[0].current_period_end * 1000);

//   return {
//     planName,
//     price,
//     startDate,
//     nextBillingDate,
//     status: phyziroSub.status,
//   };
// };
