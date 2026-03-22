import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get affiliate record for commission info
    const affiliate = await prismadb.affiliate.findUnique({
      where: { userId },
    });

    // Get user's affiliate/referral code
    const affiliateCode = await prismadb.referralCode.findUnique({
      where: { userId },
    });

    if (!affiliateCode) {
      return NextResponse.json({
        monthlyEarnings: 0,
        lifetimeEarnings: 0,
        monthlyReferrals: 0,
        lifetimeReferrals: 0,
        pendingBalance: 0,
        commissionType: "percentage",
        commissionRate: 15,
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all subscription referrals with their rewards
    const allReferrals = await prismadb.referral.findMany({
      where: {
        refereeId: userId,
        referralCode: affiliateCode.referralCode,
        event: "subscription",
      },
      include: {
        ReferralReward: true,
      },
    });

    const monthlyReferrals = allReferrals.filter(
      (ref) => ref.createdAt >= startOfMonth
    );

    // Calculate earnings from actual reward records (stored in cents)
    const lifetimeEarnings = allReferrals.reduce((sum, ref) => {
      return sum + (ref.ReferralReward?.referrerReward ?? 0);
    }, 0) / 100; // Convert cents to dollars

    const monthlyEarnings = monthlyReferrals.reduce((sum, ref) => {
      return sum + (ref.ReferralReward?.referrerReward ?? 0);
    }, 0) / 100;

    return NextResponse.json({
      monthlyEarnings,
      lifetimeEarnings,
      monthlyReferrals: monthlyReferrals.length,
      lifetimeReferrals: allReferrals.length,
      pendingBalance: affiliate?.pendingBalance ?? 0,
      commissionType: affiliate?.commissionType ?? "percentage",
      commissionRate: affiliate?.commissionRate ?? 15,
    });
  } catch (error) {
    console.error("[Affiliate:Stats] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
