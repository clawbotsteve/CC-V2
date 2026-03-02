import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prismadb.user.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.userId,
    });
  } catch (error) {
    console.error("[/api/user/onboard] fallback due to upstream error:", error);

    // Fallback: avoid hard-crashing UI in dev/runtime when DB is unavailable.
    return NextResponse.json({
      success: true,
      userId,
      firstVisit: false,
      degraded: true,
    });
  }
}
