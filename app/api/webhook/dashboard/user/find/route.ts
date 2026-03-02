import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants';
import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const body = await req.json();
  const email = body?.email;

  // Check auth token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  if (token !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });

    const userId = users.data[0].id ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ userId: userId });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
