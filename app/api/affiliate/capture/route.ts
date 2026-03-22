import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import prismadb from "@/lib/prismadb";

const AFFILIATE_COOKIE_NAME = "affiliate_code";

/**
 * Called client-side after signup/login to persist the affiliate cookie
 * into the user's meta.affiliateCode field.
 */
export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cookieStore = await cookies();
    const affiliateCode = cookieStore.get(AFFILIATE_COOKIE_NAME)?.value;

    if (!affiliateCode) {
      return NextResponse.json({ captured: false, reason: "no_cookie" });
    }

    // Verify the affiliate code actually exists
    const codeExists = await prismadb.referralCode.findUnique({
      where: { referralCode: affiliateCode },
    });

    if (!codeExists) {
      return NextResponse.json({ captured: false, reason: "invalid_code" });
    }

    // Prevent self-referral
    if (codeExists.userId === userId) {
      return NextResponse.json({ captured: false, reason: "self_referral" });
    }

    // Check if user already has an affiliate code stored
    const user = await prismadb.user.findUnique({
      where: { userId },
      select: { meta: true },
    });

    const existingMeta = (user?.meta as Record<string, unknown>) || {};
    if (existingMeta.affiliateCode) {
      return NextResponse.json({ captured: false, reason: "already_set" });
    }

    // Store affiliate code in user meta
    await prismadb.user.update({
      where: { userId },
      data: {
        meta: {
          ...existingMeta,
          affiliateCode,
          affiliateCapturedAt: new Date().toISOString(),
        },
      },
    });

    // Clear the cookie since it's now persisted
    const response = NextResponse.json({ captured: true, code: affiliateCode });
    response.cookies.delete(AFFILIATE_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("[Affiliate:Capture] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
