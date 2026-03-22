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
    const body = await req.json();
    const { search, statusFilter } = body;

    const where: Record<string, unknown> = {};
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (search) {
      where.OR = [
        { affiliateCode: { contains: search, mode: "insensitive" } },
        { userId: { contains: search, mode: "insensitive" } },
      ];
    }

    const affiliates = await prismadb.affiliate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Enrich with user info and referral counts
    const enriched = await Promise.all(
      affiliates.map(async (aff) => {
        const [user, referralCount, conversionCount, pendingPayouts] = await Promise.all([
          prismadb.user.findUnique({
            where: { userId: aff.userId },
            select: { name: true, email: true, imageUrl: true },
          }),
          prismadb.referral.count({
            where: { referralCode: aff.affiliateCode },
          }),
          prismadb.referral.count({
            where: { referralCode: aff.affiliateCode, event: "subscription" },
          }),
          prismadb.affiliatePayout.count({
            where: { affiliateId: aff.id, status: "pending" },
          }),
        ]);

        return {
          ...aff,
          userName: user?.name ?? "",
          userEmail: user?.email ?? "",
          userImageUrl: user?.imageUrl ?? "",
          totalReferrals: referralCount,
          totalConversions: conversionCount,
          pendingPayoutRequests: pendingPayouts,
        };
      })
    );

    // Summary stats
    const totalAffiliates = affiliates.length;
    const activeAffiliates = affiliates.filter((a) => a.status === "active").length;
    const totalEarnings = affiliates.reduce((sum, a) => sum + a.totalEarnings, 0);
    const totalPending = affiliates.reduce((sum, a) => sum + a.pendingBalance, 0);
    const totalPaidOut = affiliates.reduce((sum, a) => sum + a.totalPaidOut, 0);

    return NextResponse.json({
      affiliates: enriched,
      summary: {
        totalAffiliates,
        activeAffiliates,
        totalEarnings,
        totalPending,
        totalPaidOut,
      },
    });
  } catch (error) {
    console.error("[Dashboard:Affiliates] Error:", error);
    return NextResponse.json({ error: "Failed to load affiliates" }, { status: 500 });
  }
}
