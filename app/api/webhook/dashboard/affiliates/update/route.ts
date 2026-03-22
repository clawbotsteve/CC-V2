import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { INTERNAL_DASHBOARD_TOKEN } from "@/constants/constants";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  if (token !== INTERNAL_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  try {
    const { affiliateId, ...updateFields } = await req.json();

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
    }

    const allowedFields = [
      "commissionType",
      "commissionRate",
      "status",
      "payoutMethod",
      "payoutEmail",
      "minimumPayout",
      "notes",
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        data[key] = updateFields[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const before = await prismadb.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!before) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const after = await prismadb.affiliate.update({
      where: { id: affiliateId },
      data,
    });

    return NextResponse.json({
      message: "Affiliate updated",
      before,
      after,
    });
  } catch (error) {
    console.error("[Dashboard:Affiliates:Update] Error:", error);
    return NextResponse.json({ error: "Failed to update affiliate" }, { status: 500 });
  }
}
