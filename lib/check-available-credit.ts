import { ToolType } from "@prisma/client";
import prismadb from "./prismadb";
import { getToolCreditCost } from "./get-credit-cost";

/**
 * Checks if a user has enough available credits to use a specific tool.
 *
 * @param {Object} params
 * @param {string} params.userId - The user's ID
 * @param {ToolType} params.tool - The tool type to check
 * @param {string} [params.variant] - Optional tool variant
 * @param {string} [params.tier] - Optional subscription tier string, fallback to user's tier
 * @returns {Promise<{ canUse: boolean, creditCost: number }>} - Whether the user can use it, and the cost
 */
export async function checkAvailableCredit({
  userId,
  tool,
  variant = "default",
  tier,
}: {
  userId: string;
  tool: ToolType;
  variant?: string;
  tier?: string;
}): Promise<{ canUse: boolean; creditCost: number }> {
  try {
    // 1️⃣ Get user's subscription tier if not passed
    let userTier = tier;
    if (!userTier) {
      const userSubscription = await prismadb.userSubscription.findUnique({
        where: { userId: userId },
        select: { plan: true },
      });
      if (!userSubscription?.plan?.tier) {
        console.warn(`[checkAvailableCredit] No subscription tier found for user: ${userId}`);
        if (process.env.NODE_ENV === "development") {
          return { canUse: true, creditCost: 1 };
        }
        return { canUse: false, creditCost: 0 };
      }
      userTier = userSubscription.plan.tier;
    }

    // 2️⃣ Get tool's credit cost for this tier
    const creditCost = (await getToolCreditCost({ tier: userTier, tool, variant })) as number;
    if (creditCost <= 0) {
      if (process.env.NODE_ENV === "development") {
        return { canUse: true, creditCost: 1 };
      }
      return { canUse: false, creditCost: 0 };
    }

    // 3️⃣ Get user's available credits
    const userLimit = await prismadb.userApiLimit.findUnique({
      where: { userId },
      select: { availableCredit: true },
    });

    const hasCredits = (userLimit?.availableCredit ?? 0) >= creditCost;
    const canUse = hasCredits || process.env.NODE_ENV === "development";

    return { canUse, creditCost };
  } catch (error: any) {
    const msg = String(error?.message || "");
    const missingTable =
      msg.includes("UserSubscription") ||
      msg.includes("userSubscription") ||
      msg.includes("does not exist in the current database");

    if (missingTable || process.env.NODE_ENV === "development") {
      console.warn("[checkAvailableCredit] degraded mode: bypassing credit check", error);
      return { canUse: true, creditCost: 1 };
    }

    throw error;
  }
}
