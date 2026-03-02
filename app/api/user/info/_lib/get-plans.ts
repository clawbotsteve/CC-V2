import prisma from "@/lib/prismadb";

export async function getAvailablePlans() {
  return await prisma.subscriptionTier.findMany({
    where: { status: "active" },
    orderBy: { price: "asc" },
  });
}
