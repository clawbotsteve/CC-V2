import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function POST() {
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
      return NextResponse.json(
        { error: "No affiliate account found" },
        { status: 404 }
      );
    }

    // Get all unpaid referrals (subscription events)
    const unpaidReferrals = await prismadb.referral.findMany({
      where: {
        refereeId: userId,
        referralCode: affiliateCode.referralCode,
        event: "subscription",
        ReferralReward: {
          isNot: null,
        },
      },
      include: {
        ReferralReward: true,
      },
    });

    // Calculate total payout amount (each referral = $5)
    const totalAmount = unpaidReferrals.length * 5;

    if (totalAmount === 0) {
      return NextResponse.json(
        { error: "No earnings available for payout" },
        { status: 400 }
      );
    }

    // TODO: Implement actual payout processing
    // For now, just return success
    // In production, this would:
    // 1. Create a payout record
    // 2. Mark referrals as paid
    // 3. Process payment via payment provider
    // 4. Send notification

    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully",
      amount: totalAmount,
      referralsCount: unpaidReferrals.length,
    });
  } catch (error) {
    console.error("[Affiliate:Payout] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

