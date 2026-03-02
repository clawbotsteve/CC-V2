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

    const { id: upscaleId } = await params;

    const upscaled = await prismadb.upscaled.findUnique({
      where: { id: upscaleId },
    });

    if (!upscaled) {
      return NextResponse.json({ error: "Upscaled image not found" }, { status: 404 });
    }

    if (upscaled.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prismadb.upscaled.delete({
      where: { id: upscaleId },
    });

    return NextResponse.json({
      success: true,
      message: "Upscaled image deleted successfully",
    });
  } catch (error) {
    console.error("Delete upscaled image error:", error);
    return NextResponse.json(
      { error: "Failed to delete upscaled image" },
      { status: 500 }
    );
  }
}
