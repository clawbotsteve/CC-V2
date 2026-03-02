import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const cursor = searchParams.get("cursor");

  if (!userId) return new NextResponse("Missing userId", { status: 400 });

  const transactions = await prismadb.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });

  const nextCursor = transactions.length === limit ? transactions[limit - 1].id : null;

  return NextResponse.json({ data: transactions, next_cursor: nextCursor });
}
