import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's affiliate code
    const affiliateCode = await prismadb.referralCode.findUnique({
      where: { userId },
    });

    if (!affiliateCode) {
      return NextResponse.json({
        monthlyEarnings: 0,
        lifetimeEarnings: 0,
        monthlyReferrals: 0,
        lifetimeReferrals: 0,
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all referrals where this user is the referrer (refereeId = this user's ID)
    // and the referral code matches this user's affiliate string
    const allReferrals = await prismadb.referral.findMany({
      where: {
        refereeId: userId, // This user referred others
        referralCode: affiliateCode.referralCode, // Match the affiliate string
        event: "subscription",
      },
      include: {
        ReferralReward: true,
      },
    });

    // Filter for this month
    const monthlyReferrals = allReferrals.filter(
      (ref) => ref.createdAt >= startOfMonth
    );

    // Calculate earnings (each subscription = $5)
    const lifetimeEarnings = allReferrals.length * 5;
    const monthlyEarnings = monthlyReferrals.length * 5;

    return NextResponse.json({
      monthlyEarnings,
      lifetimeEarnings,
      monthlyReferrals: monthlyReferrals.length,
      lifetimeReferrals: allReferrals.length,
    });
  } catch (error) {
    console.error("[Affiliate:Stats] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

