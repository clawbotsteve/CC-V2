// /app/api/check-expiring/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import novu from "@/lib/novu";
import prismadb from "@/lib/prismadb";

const getUserSubscription = async (userId: string) => {
  const subscription = await prismadb.userSubscription.findUnique({
    where: { userId },
    select: {
      userId: true,
      status: true,
      phyziroSubscriptionId: true,
      phyziroCurrentPeriodEnd: true,
    },
  });

  if (!subscription) return null;

  const user = await prismadb.user.findUnique({
    where: { userId },
    select: {
      meta: true,
    },
  });

  return {
    ...subscription,
    meta: user?.meta ?? null,
  };
};

const markNotificationSent = async (userId: string) => {
  // First fetch current meta JSON
  const user = await prismadb.user.findUnique({
    where: { userId },
    select: { meta: true },
  });

  // Ensure meta is an object before spreading
  const currentMeta =
    user?.meta && typeof user.meta === 'object' && !Array.isArray(user.meta)
      ? user.meta
      : {};

  // Update meta with paymentUpdateNotified = true
  const updatedMeta = {
    ...currentMeta,
    paymentUpdateNotified: true,
  };

  return prismadb.user.update({
    where: { userId },
    data: {
      meta: updatedMeta,
    },
  });
};


export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(userId);
    const notified =
      subscription?.meta && typeof subscription.meta === 'object' && !Array.isArray(subscription.meta)
        ? (subscription.meta as Record<string, unknown>).paymentUpdateNotified === true
        : false;

    if (!subscription?.phyziroCurrentPeriodEnd) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const endsAt = new Date(subscription.phyziroCurrentPeriodEnd);
    const now = new Date();
    const diffInHours = (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24 && !notified && !subscription.phyziroSubscriptionId) {
      await novu.trigger({
        workflowId: 'payment-method-update',
        to: { subscriberId: userId },
        payload: {
          endsAt: endsAt.toISOString(),
        },
      });

      await markNotificationSent(userId);
    }

    return NextResponse.json({ checked: true });
  } catch (error) {
    console.error("[CHECK_EXPIRING_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
