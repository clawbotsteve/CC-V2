import { LoraSubmitData } from "@/app/(dashboard)/(routes)/tools/influencers/_components/LoraFormDialog";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isUserAdmin } from "../../user/info/_lib/check-if-admin";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthenticated." },
        { status: 401 }
      );
    }

    // Fetch LoRAs that are listed and ready for marketplace
    const loras = await prismadb.lora.findMany({
      where: {
        isListed: true,
        status: "completed",
      },
      include: {
        influencer: true,
        purchases: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    // Transform to API shape
    const result = loras.map((lora) => ({
      id: lora.id,
      name: lora.name,
      description: lora?.influencer?.description || lora.description,
      introVideoUrl: lora?.influencer?.introVideoUrl,
      avatarImageUrl: lora?.influencer?.avatarImageUrl,
      status: lora.status,
      loraName: lora.name,
      price: lora.price ?? null,
      phyziroPriceId: lora.phyziroPriceId ?? null,
      buyersCount: lora.purchases.length,
      hasPurchased: lora.purchases.some(purchase => purchase.userId === userId),
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch marketplace loras:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace loras" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId)

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: LoraSubmitData = await req.json();

    const influencer = await prismadb.influencer.findUnique({
      where: { id: body.influencerId },
    });

    if (!influencer) {
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }

    const influencerUpdated = await prismadb.influencer.update({
      where: { id: body.influencerId },
      data: {
        name: body.name,
        description: body.description,
      }
    });

    const lora = await prismadb.lora.upsert({
      where: { influencerId: body.influencerId },
      update: {
        name: body.name,
        description: body.description,
        price: body.price,
        phyziroPriceId: body.phyziroPriceId,
        isListed: body.listed === "published",
      },
      create: {
        name: body.name,
        description: body.description,
        version: "1.0.0",
        price: body.price,
        phyziroPriceId: body.phyziroPriceId,
        influencerId: body.influencerId,
        createdBy: userId,
        status: body.status ?? "published",
        isListed: body.listed === "published",
      },
    });


    return NextResponse.json(lora);
  } catch (error: any) {
    console.error("[LORA_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
