import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";

/**
 * Mark the user's onboarding as complete so we don't re-show the
 * questionnaire on their next dashboard visit. Uses the existing
 * `firstVisit` + `hasCompletedOnboarding` fields on User.
 *
 * Best-effort: failures are non-fatal (the client also sets a
 * dashboard_confetti_shown cookie that hides the modal locally).
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prismadb.user.update({
      where: { userId },
      data: {
        firstVisit: false,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[ONBOARDING] complete error:", err?.message || err);
    // Soft-fail — the client already shows the cookie-gated state.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
