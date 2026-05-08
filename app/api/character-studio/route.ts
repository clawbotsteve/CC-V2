import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { canUseCharacterStudio, requiredPlanForCharacterStudio, resolveAccessTier } from "@/lib/plan-access";
import { requireTermsAccepted } from "@/lib/require-terms-accepted";
import { Niche, NICHE_KEYS } from "@/lib/character-studio/prompt-scaffolds";

interface CreateCharacterStudioBody {
  name: string;
  niche: Niche;
  charType: "female" | "male" | "animated";
  description: string;
  brand?: string;
  product?: string;
}

/**
 * GET /api/character-studio
 * List the user's Character Studio characters (drafts + completed).
 * Includes the underlying Influencer + LoRA so the library can render
 * status / preview without a second fetch.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const characters = await prismadb.influencer.findMany({
      where: {
        userId,
        // Character Studio creates rows with characterStudioStep set;
        // legacy Influencers (direct upload-train) never set it. This
        // segregates the two flows in the library without needing a
        // separate table.
        characterStudioStep: { not: null },
        isActive: true,
      },
      include: { lora: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ characters });
  } catch (err) {
    console.error("[CHARACTER-STUDIO_GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/character-studio
 * Step 1 of the wizard. Creates a draft Influencer with the niche +
 * character setup. The reference image (Step 2), variations (Step 3),
 * LoRA training (Step 4), and prompt pack (Step 5) attach to this row
 * via subsequent endpoints.
 *
 * The draft id is a regular cuid; once the user finalizes (Step 4),
 * the row is swapped for one whose id is the FAL training requestId
 * (matching the legacy Influencer assumption that webhooks look up by
 * Influencer.id == FAL request_id).
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await requireTermsAccepted(userId))) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service to use Character Studio." },
        { status: 403 }
      );
    }

    const subscription = await prismadb.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const access = resolveAccessTier(subscription?.plan?.tier);

    if (!canUseCharacterStudio(access)) {
      return NextResponse.json(
        { error: `Character Studio requires the ${requiredPlanForCharacterStudio()} plan.` },
        { status: 403 }
      );
    }

    const body: CreateCharacterStudioBody = await req.json();

    // Field validation. Keep the messages specific so the wizard can
    // surface them inline without a generic "validation failed" toast.
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Character name is required." }, { status: 400 });
    }
    if (!body.niche || !NICHE_KEYS.includes(body.niche)) {
      return NextResponse.json({ error: "Pick a valid niche." }, { status: 400 });
    }
    if (!body.charType || !["female", "male", "animated"].includes(body.charType)) {
      return NextResponse.json({ error: "Pick a character type." }, { status: 400 });
    }
    if (!body.description?.trim() || body.description.trim().length < 20) {
      return NextResponse.json(
        { error: "Add a description with at least 20 characters so we can build a good base reference." },
        { status: 400 }
      );
    }

    const character = await prismadb.influencer.create({
      data: {
        userId,
        name: body.name.trim(),
        description: body.description.trim(),
        // gender is the legacy enum; we mirror it from charType so the
        // existing influencers UI / generation endpoints still resolve
        // correctly. "animated" maps to female since the enum doesn't
        // have a neutral; the characterStudioCharType is the source
        // of truth for Character Studio.
        gender: body.charType === "male" ? "male" : "female",
        // The trigger word is what the LoRA learns to associate with
        // the character. We default to a sluggified name; the user can
        // edit later if needed.
        triggerWord: body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24) || "character",
        avatarImageUrl: "",
        status: "queued",
        isActive: true,
        isPublic: false,
        contentType: "sfw",
        // Character Studio metadata
        niche: body.niche,
        characterStudioCharType: body.charType,
        characterStudioBrand: body.brand?.trim() || null,
        characterStudioProduct: body.product?.trim() || null,
        characterStudioStep: "setup",
        characterStudioVariations: [],
      },
    });

    return NextResponse.json({ character }, { status: 200 });
  } catch (err) {
    console.error("[CHARACTER-STUDIO_POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
