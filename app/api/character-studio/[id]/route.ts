import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/character-studio/[id]
 * Fetch a single Character Studio character including:
 *   - the Influencer row (with characterStudio* fields)
 *   - the LoRA row (so the library knows when training completes)
 *   - the GeneratedImage rows for the variations + prompt pack so the
 *     wizard / library can show their current status without an extra
 *     fetch.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const character = await prismadb.influencer.findFirst({
      where: { id, userId, isActive: true },
      include: { lora: true },
    });

    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Pull the GeneratedImage rows for variations + prompt pack so the
    // UI doesn't need to make 21 separate requests. We collect job IDs
    // from the persisted state and fetch them in one query.
    const variationIds = character.characterStudioVariations ?? [];
    const promptPack = (character.characterStudioPromptPack ?? null) as
      | Array<{ jobId?: string; scaffoldNumber: number }>
      | null;
    const promptPackIds = (promptPack ?? [])
      .map((p) => p.jobId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const allJobIds = [...variationIds, ...promptPackIds].filter(Boolean);
    const jobImages = allJobIds.length
      ? await prismadb.generatedImage.findMany({
          where: { id: { in: allJobIds } },
          select: { id: true, status: true, imageUrl: true, prompt: true },
        })
      : [];

    return NextResponse.json({ character, jobImages });
  } catch (err) {
    console.error("[CHARACTER-STUDIO_DETAIL_GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/character-studio/[id]
 * Soft-delete (sets isActive=false). Same pattern as the existing
 * influencers DELETE — preserves the audit trail / GeneratedImage
 * rows but hides the character from the library.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const character = await prismadb.influencer.findFirst({
      where: { id, userId },
    });

    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prismadb.influencer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CHARACTER-STUDIO_DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
