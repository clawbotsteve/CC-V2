import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
   const { userId } = await auth()
 
   if (!userId) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
   }

    const { id: imageId } = await params;
    
    const image = await prismadb.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prismadb.generatedImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Image deleted successfully" 
    });

  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" }, 
      { status: 500 }
    );
  }
}