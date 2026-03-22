import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { INTERNAL_DASHBOARD_TOKEN } from "@/constants/constants";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  if (token !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  try {
    const { payoutId, action, notes } = await req.json();

    if (!payoutId || !action) {
      return NextResponse.json(
        { error: "payoutId and action are required" },
        { status: 400 }
      );
    }

    const validActions = ["approve", "reject", "processing"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const payout = await prismadb.affiliatePayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      approve: "completed",
      reject: "failed",
      processing: "processing",
    };

    const newStatus = statusMap[action];
    const updateData: Record<string, unknown> = { status: newStatus };
    if (notes) updateData.notes = notes;
    if (action === "approve") updateData.processedAt = new Date();

    const updated = await prismadb.affiliatePayout.update({
      where: { id: payoutId },
      data: updateData,
    });

    // Update affiliate balances when approving
    if (action === "approve" && payout.status !== "completed") {
      await prismadb.affiliate.update({
        where: { id: payout.affiliateId },
        data: {
          totalPaidOut: { increment: payout.amount },
          pendingBalance: { decrement: payout.amount },
        },
      });
    }

    return NextResponse.json({
      message: `Payout ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "marked as processing"}`,
      payout: updated,
    });
  } catch (error) {
    console.error("[Dashboard:Affiliates:PayoutAction] Error:", error);
    return NextResponse.json({ error: "Failed to process payout action" }, { status: 500 });
  }
}
