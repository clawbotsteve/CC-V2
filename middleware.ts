import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/settings(.*)',
  '/tools(.*)',
]);

const isIgnoredRoute = createRouteMatcher([
  '/api/webhook(.*)',
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

  // 🔒 Auth for protected routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Always redirect to local /sign-in, not external URL
      // The sign-in page will handle embedding external URLs
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
}, { 
  // Disable satellite mode to prevent automatic redirects to external URLs
  // We handle external URL embedding manually in the sign-in page
  isSatellite: false
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
