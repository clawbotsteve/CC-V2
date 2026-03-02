import prismadb from "@/lib/prismadb";

export async function isUserAdmin(userId: string): Promise<boolean> {
  const adminRecord = await prismadb.admin.findUnique({
    where: { userId },
    select: { id: true },
  });

  return Boolean(adminRecord);
}
