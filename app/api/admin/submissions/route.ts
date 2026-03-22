import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { isUserAdmin } from "@/app/api/user/info/_lib/check-if-admin";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const submissions = await (prismadb as any).creatorSubmission.findMany({
      where: status && status !== "all" ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("[/api/admin/submissions][GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
