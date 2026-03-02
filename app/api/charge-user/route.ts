// app/api/charge-user/route.ts
import { NextResponse } from "next/server";
import { chargeUserForTool } from "@/lib/charge-user";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Optional: Validate incoming data shape here

    const result = await chargeUserForTool(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 400 }
    );
  }
}
