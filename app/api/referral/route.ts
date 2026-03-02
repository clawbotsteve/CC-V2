// app/api/user/referrals/route.ts

import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const referralCode = await prismadb.referralCode.findUnique({
      where: { userId },
    });

    if (!referralCode) {
      return NextResponse.json({ referrals: [], totalReferredUsers: 0 });
    }

    const referrals = await prismadb.referral.findMany({
      where: {
        refereeId: userId,
        referralCode: referralCode.referralCode,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!referrals.length) {
      return NextResponse.json({ referrals: [], totalReferredUsers: 0 });
    }

    const referredUserIds = referrals
      .map((r) => r.referredUserId)
      .filter((id): id is string => Boolean(id));

    if (!referredUserIds.length) {
      return NextResponse.json({ referrals: [], totalReferredUsers: 0 });
    }

    const users = await prismadb.user.findMany({
      where: {
        userId: { in: referredUserIds },
      },
    });

    const referralsWithUser = await Promise.all(
      referrals.map(async (r) => {
        const user = users.find((u) => u.userId === r.referredUserId) || null;

        let commission = null;
        if (r.event === "subscription") {
          const reward = await prismadb.referralReward.findUnique({
            where: { referralId: r.id },
            select: {
              referrerReward: true,
            },
          });

          commission = reward?.referrerReward ?? null;
        }

        return {
          ...r,
          referredUser: user,
          commission,
        };
      })
    );

    const activeBuyers = referralsWithUser.filter(
      (r) => r.event === "subscription"
    ).length;

    const totalCommission = referralsWithUser.reduce((sum, r) => {
      return sum + (typeof r.commission === "number" ? r.commission : 0);
    }, 0);

    return NextResponse.json({
      referrals: referralsWithUser,
      totalReferredUsers: referrals.length,
      activeBuyers,
      totalCommission,
    });
  } catch (error) {
    console.error("[REFERRALS_GET] Internal Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
