import prismadb from "@/lib/prismadb"; // adjust import path as needed

export async function grantCredit(userId: string, creditAmount: number) {
  if (creditAmount <= 0) {
    throw new Error("Credit amount must be greater than 0");
  }

  return await prismadb.userApiLimit.upsert({
    where: { userId },
    update: {
      availableCredit: {
        increment: creditAmount,
      },
    },
    create: {
      userId,
      availableCredit: creditAmount,
    },
  });
}
