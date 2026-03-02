import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

interface Params {
  jobId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await auth();
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
    }

    const editJob = await prismadb.imageEdit.findFirst({
      where: {
        id: jobId,
        userId: user.userId,
      },
      select: {
        status: true,
        editedUrl: true,
      },
    });

    if (!editJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ status: editJob.status, imageUrl: editJob.editedUrl }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch edit job status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
