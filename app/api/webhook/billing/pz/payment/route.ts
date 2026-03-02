import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { addCreditsFromPack } from "@/lib/api-limit";

export async function POST(req: Request) {
  try {
    // ✅ Check Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token !== process.env.PHYZIRRO_WEBHOOK_SECRET) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    if (body.event !== "payment.completed") {
      return new NextResponse("Event not supported", { status: 400 });
    }

    const data = body.data;

    if (!data?.userId || data.status !== "completed") {
      return new NextResponse("Invalid payment data", { status: 400 });
    }

    // ✅ Check if user exists in DB
    const user = await prismadb.userSubscription.findUnique({
      where: { userId: data.userId },
    });

    if (!user) {
      console.error(`[PHYZIRO] User not found: ${data.userId}`);

      return NextResponse.json(
        { event: 'one-time-charge', message: "error", reason: "Invalid userId" },
        { status: 404 }
      );
    }

    // 🎯 LoRA Purchase Handling
    if (data.paymentType?.startsWith("lora-")) {
      const loraId = data.paymentType.substring("lora-".length);
      if (!loraId) {
        return new NextResponse("Invalid LoRA ID", { status: 400 });
      }

      await prismadb.loraPurchase.upsert({
        where: {
          userId_loraId: {
            userId: data.userId,
            loraId,
          },
        },
        update: {}, // no-op
        create: {
          userId: data.userId,
          loraId,
        },
      });

      // Create transaction record
      await prismadb.transaction.create({
        data: {
          userId: data.userId,
          phyziroId: data.paymentId || data.paymentType,
          amount: Math.round((data.amount || 0) / 100),
          currency: data.currency || "usd",
          status: data.status,
          type: "credit_pack",
          metadata: { loraId, userId: data.userId },
          createdAt: data.createdAt ? new Date(data.createdAt * 1000) : new Date(),
        },
      });

      console.log(`[PHYZIRO] LoRA ${loraId} purchased by user ${data.userId}`);
      return NextResponse.json(
        { event: "one-time-charge", message: "success" },
        { status: 200 }
      );
    }

    // 🎯 Credit Purchase Handling
    if (data.paymentType?.startsWith("charge-")) {
      const packId = data.paymentType.substring("charge-".length);
      if (!packId) {
        return new NextResponse("Invalid charge pack ID", { status: 400 });
      }

      const creditPack = await prismadb.creditPack.findUnique({
        where: { packId },
      });

      if (!creditPack) {
        console.error(`[PHYZIRO] Invalid credit packId: ${packId}`);
        return new NextResponse("Invalid credit pack", { status: 400 });
      }

      await addCreditsFromPack(data.userId, creditPack.credits);

      // Create transaction record
      await prismadb.transaction.create({
        data: {
          userId: data.userId,
          phyziroId: data.paymentId || data.paymentType,
          amount: Math.round((data.amount || 0) / 100),
          currency: data.currency || "usd",
          status: data.status,
          type: "credit_pack",
          metadata: { packId, userId: data.userId },
          createdAt: data.createdAt ? new Date(data.createdAt * 1000) : new Date(),
        },
      });

      console.log(`[PHYZIRO] Added ${creditPack.credits} credits to user ${data.userId}`);
      return NextResponse.json(
        { event: "one-time-charge", message: "success" },
        { status: 200 }
      );
    }

    return new NextResponse("Unknown or incomplete payment data", { status: 400 });
  } catch (error) {
    console.error("[PHYZIRO_PAYMENT_WEBHOOK_ERROR]", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
