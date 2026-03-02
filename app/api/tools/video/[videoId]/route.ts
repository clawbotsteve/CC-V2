import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
  }

  try {
    const existing = await prismadb.generatedVideo.findUnique({
      where: { id: videoId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 500 });
    }

    await prismadb.generatedVideo.delete({
      where: { id: videoId, userId },
    });

    return NextResponse.json({ message: "Video deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[VIDEO_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
