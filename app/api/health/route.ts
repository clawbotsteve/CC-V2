import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function GET() {
  const falConfigured = Boolean(process.env.FAL_API_KEY);

  let dbOk = false;
  let dbError: string | undefined;

  try {
    await prismadb.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (error) {
    dbOk = false;
    dbError = error instanceof Error ? error.message : "Unknown DB error";
  }

  const ok = dbOk && falConfigured;

  return NextResponse.json(
    {
      ok,
      services: {
        db: dbOk ? "ok" : "down",
        fal: falConfigured ? "configured" : "missing_key",
      },
      ...(dbError ? { dbError } : {}),
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
