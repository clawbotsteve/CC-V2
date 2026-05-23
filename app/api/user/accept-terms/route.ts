import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { CURRENT_TERMS_VERSION } from "@/constants/constants";
import { ensureUserExists } from "@/lib/ensure-user-exists";

/**
 * Records the user's acceptance of the Terms / Privacy Policy / AUP
 * and the 18+ + likeness-consent attestations. Stores the timestamp
 * and the terms version they accepted; bumping CURRENT_TERMS_VERSION
 * later will re-prompt them.
 *
 * Body shape:
 *   {
 *     ageConfirmed: boolean,    // "I am at least 18"
 *     likenessConfirmed: boolean, // "I will not depict real people without consent"
 *     termsConfirmed: boolean,  // "I agree to ToS / Privacy / AUP"
 *   }
 *
 * All three must be true. We store ONLY the acceptance — no need to
 * keep the individual checkboxes since acceptance is binary.
 *
 * Lazy-create the User row first (2026-05-20): previously this route
 * did a raw .update() which threw "Record to update not found." if the
 * Clerk → DB webhook (/api/webhook/user-created) had silently failed or
 * never fired (e.g. on localhost with no public webhook URL). The user
 * then hit a 500 from the ToS modal and was LOCKED OUT of the entire
 * product — they couldn't accept terms, so every other API gated by
 * requireTermsAccepted refused them too. ensureUserExists() is the
 * existing helper (lib/ensure-user-exists.ts) designed for exactly
 * this — it fetches from Clerk and creates the User + free plan +
 * UserApiLimit on demand. Calling it here is idempotent.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { ageConfirmed, likenessConfirmed, termsConfirmed } = body ?? {};

    if (!ageConfirmed || !likenessConfirmed || !termsConfirmed) {
      return NextResponse.json(
        { error: "All three attestations are required to use TaviraLabs." },
        { status: 400 }
      );
    }

    // Lazy-create the User row from Clerk if missing. No-op when it
    // already exists.
    const ensured = await ensureUserExists(userId);
    if (!ensured) {
      console.error(
        "[accept-terms] ensureUserExists returned false for",
        userId,
        "— Clerk fetch likely failed",
      );
      return NextResponse.json(
        { error: "Couldn't load your account. Please refresh and try again." },
        { status: 500 },
      );
    }

    const now = new Date();
    await prismadb.user.update({
      where: { userId },
      data: {
        termsAcceptedAt: now,
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    return NextResponse.json({
      ok: true,
      termsAcceptedAt: now.toISOString(),
      termsVersion: CURRENT_TERMS_VERSION,
    });
  } catch (err: any) {
    console.error("[accept-terms] error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to save acceptance. Please try again." },
      { status: 500 }
    );
  }
}
