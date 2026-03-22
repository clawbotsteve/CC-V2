import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { INTERNAL_DASHBOARD_TOKEN } from "@/constants/constants";
import { generateUniqueAffiliateString } from "@/lib/generate-affiliate-string";

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
    const {
      userId,
      email,
      commissionType = "percentage",
      commissionRate = 15.0,
      payoutMethod,
      payoutEmail,
      notes,
    } = await req.json();

    // Find user by userId or email
    let targetUserId = userId;
    if (!targetUserId && email) {
      const user = await prismadb.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { userId: true },
      });
      if (!user) {
        return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
      }
      targetUserId = user.userId;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }

    // Check user exists
    const user = await prismadb.user.findUnique({
      where: { userId: targetUserId },
      select: { userId: true, name: true, email: true },
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
        { error: "Affiliate already exists for this user", affiliate: existing },
        { status: 409 }
      );
    }

    // Get or create referral code
    let referralCode = await prismadb.referralCode.findUnique({
      where: { userId: targetUserId },
    });
    if (!referralCode) {
      const code = await generateUniqueAffiliateString();
      referralCode = await prismadb.referralCode.create({
        data: { userId: targetUserId, referralCode: code },
      });
    }

    // Create affiliate
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coregen.ai";
    const cleanUrl = appUrl.replace(/\/$/, "");

    return NextResponse.json({
      message: "Affiliate created successfully",
      affiliate,
      affiliateLink: `${cleanUrl}?affiliate=${affiliate.affiliateCode}`,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("[Dashboard:Affiliates:Create] Error:", error);
    return NextResponse.json({ error: "Failed to create affiliate" }, { status: 500 });
  }
}
