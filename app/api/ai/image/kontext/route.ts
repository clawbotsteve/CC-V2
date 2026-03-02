import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Flux Pro Kontext has been removed. Please use Nano Banana 2 Edit." },
    { status: 410 }
  );
}
