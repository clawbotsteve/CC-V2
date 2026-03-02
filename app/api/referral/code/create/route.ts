// /app/api/referral/code/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { generateUniqueReferralCode } from "@/lib/generate-referral-code";

export async function POST() {
  const { userId } = await auth();
  console.log("[Referral] Authenticated userId:", userId);

  if (!userId) {
    console.warn("[Referral] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const newCode = await generateUniqueReferralCode();
    console.log("[Referral] Generated referral code:", newCode);

    const saved = await prismadb.referralCode.upsert({
      where: { userId },
      update: {}, // do not update anything if already exists
      create: {
        userId,
        referralCode: newCode,
      },
    });

    console.log("[Referral] Referral code saved:", saved.referralCode);

    return NextResponse.json({ code: saved.referralCode });
  } catch (error) {
    console.error("[Referral] Error creating referral code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
