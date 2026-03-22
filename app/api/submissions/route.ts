import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

function parseMediaUrls(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const fullName = String(body?.fullName || "").trim();
    const notes = typeof body?.notes === "string" ? body.notes.trim() : null;
    const mediaUrls = parseMediaUrls(body?.mediaUrls);
    const consentAccepted = Boolean(body?.consentAccepted);
    const rightsConfirmed = Boolean(body?.rightsConfirmed);

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (mediaUrls.length < 1) {
      return NextResponse.json({ error: "At least one media URL is required" }, { status: 400 });
    }
    if (!consentAccepted || !rightsConfirmed) {
      return NextResponse.json(
        { error: "Consent and rights confirmation are required" },
        { status: 400 }
      );
    }

    const submission = await (prismadb as any).creatorSubmission.create({
      data: {
        userId,
        fullName,
        notes,
        mediaUrls,
        consentAccepted,
        rightsConfirmed,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("[/api/submissions][POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
