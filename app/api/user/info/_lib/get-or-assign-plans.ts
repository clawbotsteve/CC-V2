import prisma from "@/lib/prismadb";
import { assignPlan } from "@/lib/assign-plan";
import { getPlanIdByTier } from "@/lib/get-plan-id-by-tier";
import { PLAN_FREE } from "@/constants";
import { UserSubscription } from "@prisma/client";

export async function getOrAssignSubscription(userId: string) {
  let subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription?.planId) {
    const freePlanId = await getPlanIdByTier(PLAN_FREE);
    await assignPlan(userId, freePlanId);
    subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  if (!subscription?.planId || !subscription.plan) {
    throw new Error(`Failed to resolve subscription for user: ${userId}`);
  }

  return subscription;
}
