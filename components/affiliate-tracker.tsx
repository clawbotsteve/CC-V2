"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

const AFFILIATE_COOKIE_NAME = "affiliate__ccai";
const COOKIE_EXPIRY_DAYS = 90;

function AffiliateTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const affiliateParam = searchParams.get("affiliate");

    if (affiliateParam) {
      // Store with expiry timestamp
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

      const cookieValue = JSON.stringify({
        code: affiliateParam,
        expires: expiryDate.getTime(),
      });

      // Set cookie with 90 day expiry
      Cookies.set(AFFILIATE_COOKIE_NAME, cookieValue, {
        expires: COOKIE_EXPIRY_DAYS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "development" ? undefined : ".openclaw.ai",
      });

      console.log(`[AffiliateTracker] Affiliate cookie set: ${affiliateParam}`);
    }
  }, [searchParams]);

  return null;
}

export function AffiliateTracker() {
  return (
    <Suspense fallback={null}>
      <AffiliateTrackerInner />
    </Suspense>
  );
}

