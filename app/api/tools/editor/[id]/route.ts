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

    const { id: editId } = await params;

    const imageEdit = await prismadb.imageEdit.findUnique({
      where: { id: editId },
    });

    if (!imageEdit) {
      return NextResponse.json({ error: "Image edit not found" }, { status: 404 });
    }

    if (imageEdit.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prismadb.imageEdit.delete({
      where: { id: editId },
    });

    return NextResponse.json({
      success: true,
      message: "Image edit deleted successfully",
    });
  } catch (error) {
    console.error("Delete image edit error:", error);
    return NextResponse.json(
      { error: "Failed to delete image edit" },
      { status: 500 }
    );
  }
}