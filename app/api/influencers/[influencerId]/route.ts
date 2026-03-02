import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ influencerId: string }> }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { influencerId } = await params;
  if (!influencerId) {
    return NextResponse.json({ error: "Influencer ID is required" }, { status: 400 });
  }

  try {
    const existing = await prismadb.influencer.findUnique({
      where: { id: influencerId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Influencer not found" }, { status: 500 });
    }

    const lora = await prismadb.lora.findUnique({
      where: { influencerId },
    });

    // Check if LoRA has been purchased
    if (lora) {
      const purchasedLora = await prismadb.loraPurchase.findFirst({
        where: { loraId: lora.id },
      });

      // If LoRA has purchases, soft-delete instead of hard-delete
      if (purchasedLora) {
        await prismadb.influencer.update({
          where: { id: influencerId, userId },
          data: { isActive: false },
        });

        await prismadb.lora.update({
          where: { id: lora.id },
          data: { isListed: false },
        });

        return NextResponse.json({
          message: "Influencer Deleted Successfully"
        }, { status: 200 });

      } else {
        await prismadb.lora.delete({
          where: { id: lora.id },
        });
      }
    }

    // No purchases, safe to hard-delete
    await prismadb.influencer.delete({
      where: { id: influencerId, userId },
    });

    return NextResponse.json({ message: "Influencer deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[INFLUENCER_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
