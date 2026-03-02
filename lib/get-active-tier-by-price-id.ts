import prismadb from "./prismadb";

export async function getSubscriptionTierIdByPriceId(priceId: string): Promise<string | null> {
  const tier = await prismadb.subscriptionTier.findFirst({
    where: {
      OR: [
        { devPriceId: priceId },
        { phyziroPriceId: priceId },
      ],
    },
    select: {
      id: true,
    },
  });

  return tier?.id ?? null;
}
