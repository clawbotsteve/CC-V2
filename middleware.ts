import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/settings(.*)',
  '/tools(.*)',
  '/api/tools(.*)',
  '/api/ai(.*)',
]);

const isIgnoredRoute = createRouteMatcher([
  '/api/webhook(.*)',
  '/api/analytics/track',
  '/referred',
]);

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

const isAlwaysAllowed = createRouteMatcher([
  '/_next(.*)',
  '/favicon.ico',
]);

const isMaintenanceRoute = createRouteMatcher([
  '/maintenance',
]);

const isDev = process.env.NODE_ENV === 'development'

const AFFILIATE_COOKIE_NAME = 'affiliate_code';
const AFFILIATE_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

export default clerkMiddleware(async (auth, req) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';

  // ⛔️ If not in maintenance mode, block access to /maintenance
  if (!isMaintenance && isMaintenanceRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ✅ If in maintenance mode, redirect all except allowed routes to /maintenance
  if (isMaintenance && !isMaintenanceRoute(req) && !isAlwaysAllowed(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }

  // 🔓 Always allow _next and favicon
  if (isAlwaysAllowed(req)) return;

  // 🔓 Allow ignored routes (e.g. webhooks)
  if (isIgnoredRoute(req)) return;

  // 🔓 Always allow auth routes (sign-in, sign-up)
  if (isAuthRoute(req)) return;

  // Capture affiliate code from query param into a 90-day cookie
  const affiliateParam = req.nextUrl.searchParams.get('affiliate');
  let response: NextResponse | undefined;

  if (affiliateParam && !req.cookies.get(AFFILIATE_COOKIE_NAME)) {
    response = NextResponse.next();
    response.cookies.set(AFFILIATE_COOKIE_NAME, affiliateParam, {
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  // 🔒 Auth for protected routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}, {
  isSatellite: false
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
