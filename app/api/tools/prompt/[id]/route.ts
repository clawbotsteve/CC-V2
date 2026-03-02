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

    const { id: promptId } = await params;

    const prompt = await prismadb.imageAnalysis.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (prompt.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prismadb.imageAnalysis.delete({
      where: { id: promptId },
    });

    return NextResponse.json({
      success: true,
      message: "Prompt deleted successfully",
    });
  } catch (error) {
    console.error("Delete prompt error:", error);
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}
