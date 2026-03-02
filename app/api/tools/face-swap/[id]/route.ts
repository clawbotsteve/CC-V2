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

    const { id: swapId } = await params;

    const faceSwap = await prismadb.faceSwap.findUnique({
      where: { id: swapId },
    });

    if (!faceSwap) {
      return NextResponse.json({ error: "Face swap not found" }, { status: 404 });
    }

    if (faceSwap.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prismadb.faceSwap.delete({
      where: { id: swapId },
    });

    return NextResponse.json({
      success: true,
      message: "Face swap deleted successfully",
    });
  } catch (error) {
    console.error("Delete face swap error:", error);
    return NextResponse.json(
      { error: "Failed to delete face swap" },
      { status: 500 }
    );
  }
}