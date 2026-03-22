import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { isUserAdmin } from "@/app/api/user/info/_lib/check-if-admin";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = params;
    const body = await req.json();
    const status = body?.status as "approved" | "rejected" | undefined;
    const reviewNotes = typeof body?.reviewNotes === "string" ? body.reviewNotes.trim() : null;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const submission = await (prismadb as any).creatorSubmission.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("[/api/admin/submissions/[id]/review][POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
