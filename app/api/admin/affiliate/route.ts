import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { isUserAdmin } from "@/app/api/user/info/_lib/check-if-admin";
import { generateUniqueAffiliateString } from "@/lib/generate-affiliate-string";

/**
 * GET - List all affiliates (admin only)
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId || !(await isUserAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const affiliates = await prismadb.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { payouts: true },
      },
    },
  });

  // Enrich with referral counts
  const enriched = await Promise.all(
    affiliates.map(async (aff) => {
      const referralCount = await prismadb.referral.count({
        where: {
          referralCode: aff.affiliateCode,
          event: "subscription",
        },
      });
      return { ...aff, totalConversions: referralCount };
    })
  );

  return NextResponse.json(enriched);
}

/**
 * POST - Create a new affiliate (admin only)
 * Body: { userId, commissionType?, commissionRate?, payoutMethod?, payoutEmail?, notes? }
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !(await isUserAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    userId: targetUserId,
    commissionType = "percentage",
    commissionRate = 15.0,
    payoutMethod,
    payoutEmail,
    notes,
  } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Ensure user exists
  const user = await prismadb.user.findUnique({
    where: { userId: targetUserId },
    select: { userId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if affiliate already exists
  const existing = await prismadb.affiliate.findUnique({
    where: { userId: targetUserId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Affiliate already exists", affiliate: existing },
      { status: 409 }
    );
  }

  // Get or create referral code for this user
  let referralCode = await prismadb.referralCode.findUnique({
    where: { userId: targetUserId },
  });

  if (!referralCode) {
    const code = await generateUniqueAffiliateString();
    referralCode = await prismadb.referralCode.create({
      data: {
        userId: targetUserId,
        referralCode: code,
      },
    });
  }

  const affiliate = await prismadb.affiliate.create({
    data: {
      userId: targetUserId,
      affiliateCode: referralCode.referralCode,
      commissionType,
      commissionRate,
      payoutMethod,
      payoutEmail,
      notes,
    },
  });

  return NextResponse.json(affiliate, { status: 201 });
}

/**
 * PATCH - Update an affiliate (admin only)
 * Body: { affiliateId, commissionType?, commissionRate?, status?, payoutMethod?, payoutEmail?, minimumPayout?, notes? }
 */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId || !(await isUserAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { affiliateId, ...updateData } = body;

  if (!affiliateId) {
    return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
  }

  // Only allow specific fields to be updated
  const allowedFields = [
    "commissionType",
    "commissionRate",
    "status",
    "payoutMethod",
    "payoutEmail",
    "minimumPayout",
    "notes",
  ];

  const filteredData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      filteredData[key] = updateData[key];
    }
  }

  const affiliate = await prismadb.affiliate.update({
    where: { id: affiliateId },
    data: filteredData,
  });

  return NextResponse.json(affiliate);
}
