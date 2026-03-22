import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { isUserAdmin } from "@/app/api/user/info/_lib/check-if-admin";

/**
 * GET - List all payouts (admin only)
 * Query params: ?status=pending (optional filter)
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId || !(await isUserAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const payouts = await prismadb.affiliatePayout.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: {
        select: {
          userId: true,
          affiliateCode: true,
          payoutEmail: true,
        },
      },
    },
  });

  return NextResponse.json(payouts);
}

/**
 * PATCH - Update payout status (admin only)
 * Body: { payoutId, status, notes? }
 * When marking as "completed", updates the affiliate's totalPaidOut and pendingBalance
 */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId || !(await isUserAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { payoutId, status, notes } = await req.json();

  if (!payoutId || !status) {
    return NextResponse.json(
      { error: "payoutId and status are required" },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "processing", "completed", "failed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const payout = await prismadb.affiliatePayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;
  if (status === "completed") updateData.processedAt = new Date();

  const updated = await prismadb.affiliatePayout.update({
    where: { id: payoutId },
    data: updateData,
  });

  // When completed, update affiliate balances
  if (status === "completed" && payout.status !== "completed") {
    await prismadb.affiliate.update({
      where: { id: payout.affiliateId },
      data: {
        totalPaidOut: { increment: payout.amount },
        pendingBalance: { decrement: payout.amount },
      },
    });
  }

  // If reverting from completed, undo the balance changes
  if (payout.status === "completed" && status !== "completed") {
    await prismadb.affiliate.update({
      where: { id: payout.affiliateId },
      data: {
        totalPaidOut: { decrement: payout.amount },
        pendingBalance: { increment: payout.amount },
      },
    });
  }

  return NextResponse.json(updated);
}
