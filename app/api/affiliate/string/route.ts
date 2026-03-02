import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { generateUniqueAffiliateString } from "@/lib/generate-affiliate-string";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user already has an affiliate code
    let code = await prismadb.referralCode.findUnique({
      where: { userId },
    });

    // If no code exists, generate a new one
    if (!code) {
      const affiliateString = await generateUniqueAffiliateString();
      code = await prismadb.referralCode.create({
        data: {
          userId,
          referralCode: affiliateString,
        },
      });
    }

    return NextResponse.json({ affiliateString: code.referralCode });
  } catch (error) {
    console.error("[Affiliate:GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

