import prisma from "@/lib/prismadb";
import { startOfDay } from "date-fns";

export async function getUserUsage(userId: string, planTier: string) {
  const avatarCreated = await prisma.influencer.count({ where: { userId } });
  const apiUsage = await prisma.userApiLimit.findUnique({ where: { userId } });

  const dailyLimits: Record<string, number> = {
    plan_basic: 15,
    plan_pro: 30,
    plan_elite: Infinity,
  };

  const today = startOfDay(new Date());
  const dailyUsage = await prisma.dailyUsage.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
  });

  const maxDailyImages = dailyLimits[planTier] ?? 0;
  const imagesUsed = dailyUsage?.imageCount ?? 0;
  const imageCountLeft =
    maxDailyImages === Infinity ? Infinity : Math.max(maxDailyImages - imagesUsed, 0);

  return {
    avatarCreated,
    apiUsage,
    dailyUsage,
    maxDailyImages,
    imagesUsed,
    imageCountLeft,
    date: today,
  };
}
