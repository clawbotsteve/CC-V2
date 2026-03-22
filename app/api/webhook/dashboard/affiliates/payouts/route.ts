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
    const { statusFilter, affiliateId } = await req.json();

    const where: Record<string, unknown> = {};
    if (statusFilter) where.status = statusFilter;
    if (affiliateId) where.affiliateId = affiliateId;

    const payouts = await prismadb.affiliatePayout.findMany({
      where,
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

    // Enrich with user info
    const enriched = await Promise.all(
      payouts.map(async (p) => {
        const user = await prismadb.user.findUnique({
          where: { userId: p.affiliate.userId },
          select: { name: true, email: true },
        });
        return {
          ...p,
          affiliateName: user?.name ?? "",
          affiliateEmail: user?.email ?? "",
        };
      })
    );

    const summary = {
      totalPending: payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
      totalProcessing: payouts.filter((p) => p.status === "processing").reduce((s, p) => s + p.amount, 0),
      totalCompleted: payouts.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0),
      pendingCount: payouts.filter((p) => p.status === "pending").length,
    };

    return NextResponse.json({ payouts: enriched, summary });
  } catch (error) {
    console.error("[Dashboard:Affiliates:Payouts] Error:", error);
    return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 });
  }
}
