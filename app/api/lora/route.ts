import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    const purchases = await prismadb.loraPurchase.findMany({
      where: { userId },
      select: {
        lora: {
          select: {
            influencer: true,
          },
        },
      },
    });

    const influencers = purchases
      .map((p) => p.lora?.influencer)
      .filter(Boolean);


    return NextResponse.json(influencers)
  } catch (error) {
    console.error("Failed to fetch marketplace loras:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace loras" },
      { status: 500 }
    );
  }
}
