// /app/api/referral/code/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function GET() {
  const { userId } = await auth();
  console.log("[Referral:GET] Authenticated userId:", userId);

  if (!userId) {
    console.warn("[Referral:GET] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const code = await prismadb.referralCode.findUnique({
      where: { userId },
    });

    console.log("[Referral:GET] Found code:", code?.referralCode ?? "null");

    return NextResponse.json({ code: code?.referralCode ?? null });
  } catch (error) {
    console.error("[Referral:GET] Error retrieving code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
