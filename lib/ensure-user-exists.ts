import { clerkClient } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { assignPlan } from "@/lib/assign-plan";
import { getPlanIdByTier } from "@/lib/get-plan-id-by-tier";
import { PLAN_FREE } from "@/constants";

/**
 * Ensure a User row exists in our DB for the given Clerk userId.
 *
 * Safe to call from any webhook that needs to write a child record (subscription,
 * credit-pack purchase, etc.). If the user is missing — typically because the
 * `/api/webhook/user-created` Clerk webhook hasn't landed yet — we fetch from
 * Clerk and create the record, plus a baseline Free plan + UserApiLimit.
 *
 * Returns true if the user existed or was created, false if creation failed.
 */
export async function ensureUserExists(userId: string): Promise<boolean> {
  if (!userId) return false;

  const existing = await prismadb.user.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) return true;

  console.warn(`[ensureUserExists] User ${userId} missing — attempting auto-create from Clerk`);

  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");

    await prismadb.user.create({
      data: {
        userId: clerkUser.id,
        name,
        email,
        imageUrl: clerkUser.hasImage ? clerkUser.imageUrl : "",
        referralCode: "",
        firstVisit: false,
      },
    });

    // Baseline Free plan + UserApiLimit so subsequent assignPlan upserts work.
    const freePlanId = await getPlanIdByTier(PLAN_FREE);
    await assignPlan(clerkUser.id, freePlanId);

    console.info(`[ensureUserExists] Auto-created user ${userId} (${email})`);
    return true;
  } catch (err: any) {
    console.error(`[ensureUserExists] Failed to auto-create user ${userId}:`, err?.message);
    return false;
  }
}
