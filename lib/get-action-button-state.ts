import { PLAN_FREE } from "@/constants";
import { ToolType } from "@prisma/client";

type CreditCostMap = {
  [tool in ToolType]?: {
    [variant: string]: number;
  };
};

type ActionResult = {
  action: "upgrade" | "get_credit" | "normal";
  reason?: string;
  cost?: number;
};

type GetActionButtonStateParams = {
  currentPlan: string;
  availableCredit: number;
  toolType: ToolType;
  variant?: string;
  creditCosts: CreditCostMap;
};

export function getActionButtonState({
  currentPlan,
  availableCredit,
  toolType,
  variant,
  creditCosts,
}: GetActionButtonStateParams): ActionResult {
  // Only IMAGE_GENERATOR is allowed in the free plan
  const isFreePlan = currentPlan === PLAN_FREE;
  const isToolAllowed = !isFreePlan || toolType === ToolType.IMAGE_GENERATOR;

  console.log('[BUTTON_STATE]', {isFreePlan, isToolAllowed})

  // 1. If user is on free plan and tool is not IMAGE_GENERATOR, ask to upgrade
  if (!isToolAllowed) {
    return {
      action: "upgrade",
      reason: `${ToolType[toolType]} is not available in the Free plan.`,
    };
  }

  // 2. Check credit cost for tool + variant
  const variantKey = variant || "default";
  const cost = creditCosts?.[toolType]?.[variantKey] ?? 0;

  console.log('[BUTTON_STATE]', {creditCosts, toolType})
  console.log('[BUTTON_STATE]', {variantKey, cost, availableCredit})

  if (cost > availableCredit) {
    return {
      action: "get_credit",
      reason: `You need ${cost} credits but only have ${availableCredit}.`,
      cost: cost,
    };
  }

  // 3. All conditions met — proceed
  return { action: "normal" };
}
