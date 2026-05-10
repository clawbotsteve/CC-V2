import prismadb from "@/lib/prismadb";
import { CURRENT_TERMS_VERSION } from "@/constants/constants";

/**
 * Defense in depth: returns the user's row if they've accepted the
 * current terms version, otherwise returns null so the caller can
 * 403 the request.
 *
 * The frontend modal blocks the dashboard until the user accepts, but
 * a determined caller could hit /api/tools/* directly with a stale
 * token before accepting. This function is the server-side enforcement
 * that closes that hole.
 *
 * Use as:
 *
 *   const ok = await requireTermsAccepted(userId);
 *   if (!ok) return NextResponse.json(
 *     { error: "You must accept the Terms of Service to use TaviraLabs." },
 *     { status: 403 }
 *   );
 */
export async function requireTermsAccepted(userId: string): Promise<boolean> {
  try {
    const user = await prismadb.user.findUnique({
      where: { userId },
      select: { termsAcceptedAt: true, termsVersion: true },
    });
    if (!user?.termsAcceptedAt) return false;
    return user.termsVersion === CURRENT_TERMS_VERSION;
  } catch (err) {
    // If the lookup fails entirely, fail OPEN — the user already passed
    // Clerk auth, and we don't want one DB hiccup to take down the entire
    // tool. The frontend modal still gates the UI.
    console.warn("[requireTermsAccepted] lookup failed; allowing:", err);
    return true;
  }
}
