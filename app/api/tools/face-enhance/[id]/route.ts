import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: enhanceId } = await params;

    const enhance = await prismadb.faceEnhance.findUnique({
      where: { id: enhanceId },
    });

    if (!enhance) {
      return NextResponse.json({ error: "Face enhancement not found" }, { status: 404 });
    }

    if (enhance.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prismadb.faceEnhance.delete({
      where: { id: enhanceId },
    });

    return NextResponse.json({
      success: true,
      message: "Face enhancement deleted successfully",
    });
  } catch (error) {
    console.error("Delete face enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to delete face enhancement" },
      { status: 500 }
    );
  }
}