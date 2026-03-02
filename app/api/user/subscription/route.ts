import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { SubscriptionStatus } from '@prisma/client';

const DAY_IN_MS = 86_400_000;

export interface UserSubscriptionResponse {
  hasActiveSubscription: boolean;
  phyziroSubscriptionId: string | null;
  phyziroCurrentPeriodEnd: Date | null;
  status: SubscriptionStatus;
}


export async function POST(): Promise<NextResponse<UserSubscriptionResponse>> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        hasActiveSubscription: false,
        phyziroSubscriptionId: null,
        phyziroCurrentPeriodEnd: null,
        status: "incomplete",
      },
      { status: 200 }
    );
  }

  const userSubscription = await prismadb.userSubscription.findUnique({
    where: { userId },
    select: {
      phyziroSubscriptionId: true,
      phyziroCurrentPeriodEnd: true,
    },
  });

  if (!userSubscription) {
    return NextResponse.json(
      {
        hasActiveSubscription: false,
        phyziroSubscriptionId: null,
        phyziroCurrentPeriodEnd: null,
        status: "canceled",
      },
      { status: 200 }
    );
  }

  const { phyziroCurrentPeriodEnd, phyziroSubscriptionId } = userSubscription;

  const hasValidPhyziroSubscription = !!phyziroSubscriptionId;

  const hasValidPhyziro =
    phyziroCurrentPeriodEnd &&
    phyziroCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

  const hasActiveSubscription = hasValidPhyziroSubscription || !!hasValidPhyziro;

  return NextResponse.json({
    hasActiveSubscription,
    phyziroSubscriptionId,
    phyziroCurrentPeriodEnd,
    status: "active",
  });
}
