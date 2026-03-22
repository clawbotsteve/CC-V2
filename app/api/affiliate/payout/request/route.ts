import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const affiliate = await prismadb.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: "No affiliate account found" },
        { status: 404 }
      );
    }

    if (!affiliate.payoutMethod || !affiliate.payoutEmail) {
      return NextResponse.json(
        { error: "Please set up a payout method first" },
        { status: 400 }
      );
    }

    if (affiliate.pendingBalance < affiliate.minimumPayout) {
      return NextResponse.json(
        {
          error: `Minimum payout is $${affiliate.minimumPayout.toFixed(2)}. Your balance is $${affiliate.pendingBalance.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // Check for existing pending payout
    const existingPending = await prismadb.affiliatePayout.findFirst({
      where: {
        affiliateId: affiliate.id,
        status: "pending",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending payout request" },
        { status: 400 }
      );
    }

    // Create payout record
    const payout = await prismadb.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount: affiliate.pendingBalance,
        payoutMethod: affiliate.payoutMethod,
        payoutEmail: affiliate.payoutEmail,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully",
      payoutId: payout.id,
      amount: payout.amount,
    });
  } catch (error) {
    console.error("[Affiliate:Payout] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
