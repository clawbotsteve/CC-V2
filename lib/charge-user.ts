import { ToolType, GenerationStatus } from "@prisma/client";
import prismadb from "./prismadb";

export type UsageTable =
  | "Upscaled"
  | "ImageEdit"
  | "ImageAnalysis"
  | "FaceEnhance"
  | "FaceSwap"
  | "GeneratedImage"
  | "GeneratedVideo"
  | "AvatarTraining";

export type ChargeToolParams = {
  userId: string;
  tool: ToolType;
  variant?: string;
  usageId: string;
  usageTable: UsageTable;
  markFailed?: boolean;
};

export async function chargeUserForTool({
  userId,
  tool,
  variant,
  usageId,
  usageTable,
  markFailed = false,
}: ChargeToolParams) {
  console.log(
    `[ChargeUser] Start -> user=${userId}, tool=${tool}, table=${usageTable}, usageId=${usageId}, failed=${markFailed}`
  );

  // Fetch subscription and tool cost
  const subscription = await prismadb.userSubscription.findUnique({
    where: { userId },
    include: { plan: { include: { toolCosts: true } } },
  });

  if (!subscription?.plan) {
    const msg = `No active subscription found for user=${userId}`;
    console.error(`[ChargeUser] ${msg}`);
    throw new Error(msg);
  }

  const toolCost = subscription.plan.toolCosts.find((cost) =>
    variant !== undefined ? cost.tool === tool && cost.variant === variant : cost.tool === tool
  );

  if (!toolCost) {
    const msg = `Tool cost not found for tool=${tool}, variant=${variant}`;
    console.error(`[ChargeUser] ${msg}`);
    throw new Error(msg);
  }

  const creditCost = markFailed ? 0 : toolCost.creditCost;
  console.log(`[ChargeUser] ToolCost -> ${creditCost} credits`);

  const userLimit = await prismadb.userApiLimit.findUnique({
    where: { userId },
    select: { availableCredit: true },
  });

  if (!markFailed && creditCost > 0) {
    const available = userLimit?.availableCredit ?? 0;
    if (available < creditCost) {
      const msg = `[ChargeUser] Insufficient credits for user=${userId}. Required=${creditCost}, Available=${available}`;
      console.error(msg);
      throw new Error("Insufficient credits to perform this operation.");
    }
  }

  try {
    await prismadb.$transaction(async (tx) => {
      console.log(`[ChargeUser] Updating usage record in ${usageTable} with id=${usageId}`);

      const updateUsageData: any = {
        creditUsed: creditCost,
        ...(markFailed ? { status: GenerationStatus.failed } : {}),
      };

      switch (usageTable) {
        case "Upscaled":
          await tx.upscaled.update({ where: { id: usageId }, data: updateUsageData });
          break;
        case "ImageEdit":
          await tx.imageEdit.update({ where: { id: usageId }, data: updateUsageData });
          break;
        case "ImageAnalysis":
          await tx.imageAnalysis.update({ where: { id: usageId }, data: updateUsageData });
          break;
        case "FaceSwap":
          await tx.faceSwap.update({ where: { id: usageId }, data: updateUsageData });
          break;
        case "FaceEnhance":
          await tx.faceEnhance.update({ where: { id: usageId }, data: updateUsageData });
          break;
        case "GeneratedImage":
          await tx.generatedImage.update({ where: { id: usageId }, data: updateUsageData });
          break;
        case "GeneratedVideo":
          await tx.generatedVideo.update({ where: { id: usageId }, data: updateUsageData });
          break;
        case "AvatarTraining":
          await tx.influencer.update({ where: { id: usageId }, data: updateUsageData });
          break;
        default:
          throw new Error(`Invalid usageTable: ${usageTable}`);
      }

      if (!markFailed && creditCost > 0) {
        const limit = await tx.userApiLimit.findUnique({ where: { userId } });

        if (!limit) {
          const msg = `[ChargeUser] Transaction check failed: user=${userId} has no UserApiLimit record`;
          console.error(msg);
          throw new Error("Transaction failed: no user limit record");
        }

        if (limit.availableCredit < creditCost) {
          const msg = `[ChargeUser] Transaction check failed: user=${userId} has insufficient credits`;
          console.error(msg);
          throw new Error("Transaction failed: insufficient credits");
        }

        console.log(`[ChargeUser] Decrementing ${creditCost} credits from userApiLimit`);
        // Deduct from both availableCredit and monthlyRemainingCredits
        // Monthly deduction is capped at current monthly credits to prevent negative
        const monthlyDeduction = Math.min(limit.monthlyRemainingCredits, creditCost);

        console.log(`[ChargeUser] Deducting ${creditCost} credits -> Total: ${creditCost}, Monthly: ${monthlyDeduction}`);

        await tx.userApiLimit.update({
          where: { userId },
          data: {
            availableCredit: { decrement: creditCost },
            monthlyRemainingCredits: { decrement: monthlyDeduction },
            creditUsed: { increment: creditCost },
          },
        });
      }
    }, {
      timeout: 10000,
      maxWait: 10000,
    });

    console.log(`[ChargeUser] Completed -> user=${userId}, creditUsed=${creditCost}`);
    return {
      success: true,
      creditUsed: creditCost,
      skipped: markFailed,
    };
  } catch (err: any) {
    console.error(`[ChargeUser] Failed:`, err);
    throw new Error(err?.message || "Failed to charge user.");
  }
}

/**
 * Deduct credits directly without tracking in a usage table.
 * Used for synchronous operations like prompt optimization.
 */
export type DeductCreditParams = {
  userId: string;
  tool: ToolType;
  variant?: string;
};

export async function deductCredit({
  userId,
  tool,
  variant,
}: DeductCreditParams) {
  console.log(
    `[DeductCredit] Start -> user=${userId}, tool=${tool}, variant=${variant}`
  );

  // Fetch subscription and tool cost
  const subscription = await prismadb.userSubscription.findUnique({
    where: { userId },
    include: { plan: { include: { toolCosts: true } } },
  });

  if (!subscription?.plan) {
    const msg = `No active subscription found for user=${userId}`;
    console.error(`[DeductCredit] ${msg}`);
    throw new Error(msg);
  }

  const toolCost = subscription.plan.toolCosts.find((cost) =>
    variant !== undefined ? cost.tool === tool && cost.variant === variant : cost.tool === tool
  );

  if (!toolCost) {
    const msg = `Tool cost not found for tool=${tool}, variant=${variant}`;
    console.error(`[DeductCredit] ${msg}`);
    throw new Error(msg);
  }

  const creditCost = toolCost.creditCost;
  console.log(`[DeductCredit] ToolCost -> ${creditCost} credits`);

  try {
    const limit = await prismadb.userApiLimit.findUnique({
      where: { userId },
      select: { availableCredit: true, monthlyRemainingCredits: true }
    });

    if (!limit) {
      const msg = `[DeductCredit] User ${userId} has no UserApiLimit record`;
      console.error(msg);
      throw new Error("User limit record not found");
    }

    if (limit.availableCredit < creditCost) {
      const msg = `[DeductCredit] Insufficient credits for user=${userId}. Required=${creditCost}, Available=${limit.availableCredit}`;
      console.error(msg);
      throw new Error("Insufficient credits to perform this operation.");
    }

    const monthlyDeduction = Math.min(limit.monthlyRemainingCredits, creditCost);

    console.log(`[DeductCredit] Deducting ${creditCost} credits -> Total: ${creditCost}, Monthly: ${monthlyDeduction}`);

    await prismadb.userApiLimit.update({
      where: { userId },
      data: {
        availableCredit: { decrement: creditCost },
        monthlyRemainingCredits: { decrement: monthlyDeduction },
        creditUsed: { increment: creditCost },
      },
    });

    console.log(`[DeductCredit] Completed -> user=${userId}, creditUsed=${creditCost}`);
    return {
      success: true,
      creditUsed: creditCost,
    };
  } catch (err: any) {
    console.error(`[DeductCredit] Failed:`, err);
    throw new Error(err?.message || "Failed to deduct credits.");
  }
}
