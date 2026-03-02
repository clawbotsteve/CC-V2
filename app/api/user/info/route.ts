import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAvailablePlans } from "./_lib/get-plans";
import { getOrAssignSubscription } from "./_lib/get-or-assign-plans";
import { getCreditCostMap } from "./_lib/get-credit-costs";
import { getUserUsage } from "./_lib/get-usage";
import type { UserContextType } from "@/components/layout/user-context";
import { isUserAdmin } from "./_lib/check-if-admin";
import prismadb from "@/lib/prismadb";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[DEBUG]: User Id: ", userId);
  }

  try {
    const user = await prismadb.user.findUnique({
      where: { userId },
    });

    const userIsAdmin = await isUserAdmin(userId);
    const plans = await getAvailablePlans();
    const subscription = await getOrAssignSubscription(userId);
    const tier = subscription?.plan?.tier ?? "plan_free";
    const creditCosts = await getCreditCostMap(subscription.planId);
    const usage = await getUserUsage(userId, tier);

    const responseData: Omit<UserContextType, "refetch"> = {
      userId,
      plan: tier,
      planId: subscription?.plan.phyziroPriceId as string | undefined,
      customerId: subscription?.phyziroSubscriptionId as string | undefined,
      avatarCreated: usage.avatarCreated,
      maxAvatar: usage.apiUsage?.availableAvatarSlot ?? 0,
      totalCredit: subscription?.plan?.creditsPerMonth ?? 0,
      availableCredit: usage.apiUsage?.availableCredit ?? 0,
      isLoading: false,
      dailyUsage: {
        date: usage.date.toString(),
        creditUsed: usage.dailyUsage?.creditUsed ?? 0,
        imageCountLeft: usage.imageCountLeft,
        maxPerDay: usage.maxDailyImages === Infinity ? null : usage.maxDailyImages,
        imageUsed: usage.imagesUsed,
      },
      creditCosts,
      plans,
      isAdmin: userIsAdmin,
      meta: {
        firstVisit: user?.firstVisit || false,
        degraded: false,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[/api/user/info] fallback response due to upstream error:", error);

    const fallbackData: Omit<UserContextType, "refetch"> = {
      userId,
      plan: "plan_free",
      planId: undefined,
      customerId: undefined,
      avatarCreated: 0,
      maxAvatar: 0,
      totalCredit: 0,
      availableCredit: 0,
      isLoading: false,
      dailyUsage: {
        date: new Date().toString(),
        creditUsed: 0,
        imageCountLeft: 0,
        maxPerDay: null,
        imageUsed: 0,
      },
      creditCosts: {},
      plans: [],
      isAdmin: false,
      meta: {
        firstVisit: false,
        degraded: true,
      },
    };

    return NextResponse.json(fallbackData);
  }
}
