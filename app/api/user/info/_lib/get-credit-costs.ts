import prisma from "@/lib/prismadb";

export async function getCreditCostMap(tierId: string) {
  const toolCosts = await prisma.toolCreditCost.findMany({
    where: { tierId },
    select: {
      tool: true,
      variant: true,
      creditCost: true,
    },
  });

  return toolCosts.reduce<Record<string, any>>((acc, { tool, variant, creditCost }) => {
    if (variant?.trim()) {
      if (!acc[tool] || typeof acc[tool] === "number") acc[tool] = {};
      acc[tool][variant] = creditCost;
    } else {
      acc[tool] = creditCost;
    }
    return acc;
  }, {});
}
