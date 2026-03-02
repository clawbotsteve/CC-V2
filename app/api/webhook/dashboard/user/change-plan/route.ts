import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { assignPlan } from '@/lib/assign-plan';
import { getPlanIdByTier } from '@/lib/get-plan-id-by-tier';
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants';

interface RequestBody {
  userId: string;
  planTier: string;
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
  const { userId, planTier } = body;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Find UserApiLimit by userId
  const userSubscription = await prismadb.userSubscription.findUnique({
    where: {
      userId
    }
  });

  if (!userSubscription) {
    return NextResponse.json({ error: "UserSubscription record not found" }, { status: 404 });
  }

  // Prepare update data object with increment only if values provided
  if (!planTier) {
    return NextResponse.json({ error: "No plan provided provided" }, { status: 400 });
  }

  const planId = await getPlanIdByTier(planTier);
  const updatedPlan = await assignPlan(userId, planId)

  if (updatedPlan.success) {
    return NextResponse.json({ message: "User plan updated", updatedPlan });
  }
}
