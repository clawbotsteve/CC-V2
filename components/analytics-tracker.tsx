"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

const VISITOR_COOKIE = "_tl_vid";
const COOKIE_EXPIRY = 365; // days

function getOrCreateVisitorId(): string {
  let vid = Cookies.get(VISITOR_COOKIE);
  if (!vid) {
    vid = crypto.randomUUID();
    Cookies.set(VISITOR_COOKIE, vid, {
      expires: COOKIE_EXPIRY,
      sameSite: "lax",
      secure: window.location.protocol === "https:",
      path: "/",
    });
  }
  return vid;
}

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    const fullUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    if (fullUrl === lastTracked.current) return;
    lastTracked.current = fullUrl;

    const visitorId = getOrCreateVisitorId();

    // Read affiliate code from existing cookie
    let affiliateCode: string | undefined;
    const affCookie = Cookies.get("affiliate__tavira");
    if (affCookie) {
      try {
        affiliateCode = JSON.parse(affCookie).code;
      } catch {}
    }

    const payload = {
      url: pathname,
      referrer: document.referrer || "",
      visitorId,
      utmSource: searchParams?.get("utm_source") || undefined,
      utmMedium: searchParams?.get("utm_medium") || undefined,
      utmCampaign: searchParams?.get("utm_campaign") || undefined,
      utmTerm: searchParams?.get("utm_term") || undefined,
      utmContent: searchParams?.get("utm_content") || undefined,
      affiliateCode,
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        body: blob,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}
