import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb'; // your prisma client
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants';

interface RequestBody {
  userId: string;
  creditIncrease?: number;
  loraIncrease?: number;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  if (token !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const body: RequestBody = await req.json();
  const { userId, creditIncrease, loraIncrease } = body;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Find UserApiLimit by userId
  const userLimit = await prismadb.userApiLimit.findUnique({
    where: { userId }
  });

  if (!userLimit) {
    return NextResponse.json({ error: "UserApiLimit record not found" }, { status: 404 });
  }

  // Prepare update data object with increment only if values provided
  const updateData: any = {};
  if (typeof creditIncrease === 'number') {
    updateData.availableCredit = { increment: creditIncrease };
  }
  if (typeof loraIncrease === 'number') {
    updateData.availableAvatarSlot = { increment: loraIncrease };
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No increment values provided" }, { status: 400 });
  }

  const updatedLimit = await prismadb.userApiLimit.update({
    where: { userId },
    data: updateData,
  });

  return NextResponse.json({ message: "User limits updated", updatedLimit });
}
