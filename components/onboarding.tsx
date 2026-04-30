"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { destroyCookie, parseCookies } from "nookies";
import confetti from "canvas-confetti";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

/**
 * Side-effects that run once a Clerk-authed user lands on the dashboard:
 *   - Tracks any pending referral / affiliate cookies via /api/user/onboard.
 *   - Fires confetti on the first dashboard visit (cookie-gated, 30 days).
 *
 * The personalized onboarding questionnaire is NOT triggered here — it's
 * launched explicitly by the "Create Your First Image" CTA on the
 * dashboard hero (see app/(dashboard)/(routes)/dashboard/page.tsx).
 */
const Onboarding = () => {
  const { isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;

    const cookieDomain = process.env.NODE_ENV === "development" ? undefined : ".taviralabs.ai";
    const cookies = parseCookies();
    const raw = cookies["referralCode__tavira"];
    const affiliateRaw = cookies["affiliate__tavira"];
    let referralCode: string | undefined;
    let affiliateCode: string | undefined;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const now = Date.now();

        if (
          parsed?.code &&
          (typeof parsed.expires !== "number" || parsed.expires > now)
        ) {
          referralCode = parsed.code;
        } else {
          destroyCookie(null, "referralCode__tavira", {
            path: "/",
            domain: cookieDomain,
          });
        }
      } catch (err) {
        console.warn("Failed to parse referralCode cookie:", err);
        destroyCookie(null, "referralCode__tavira", {
          path: "/",
          domain: cookieDomain,
        });
      }
    }

    // Check affiliate cookie
    if (affiliateRaw) {
      try {
        const parsed = JSON.parse(affiliateRaw);
        const now = Date.now();

        if (
          parsed?.code &&
          (typeof parsed.expires !== "number" || parsed.expires > now)
        ) {
          affiliateCode = parsed.code;
        } else {
          Cookies.remove("affiliate__tavira", {
            path: "/",
            domain: cookieDomain,
          });
        }
      } catch (err) {
        console.warn("Failed to parse affiliate cookie:", err);
        Cookies.remove("affiliate__tavira", {
          path: "/",
          domain: cookieDomain,
        });
      }
    }

    // Always call the tracking endpoint — even without referralCode or affiliateCode
    fetch("/api/user/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode, affiliateCode }),
    }).finally(() => {
      destroyCookie(null, "referralCode__tavira", {
        path: "/",
        domain: cookieDomain,
      });
      // Note: Don't remove affiliate cookie yet - we need it for subscription tracking
    });
  }, [isSignedIn, isLoaded]);


  useEffect(() => {
    if (pathname !== "/dashboard") return;

    // Cookie-gated so the confetti fires only once per device per 30 days.
    if (Cookies.get("dashboard_confetti_shown")) return;
    Cookies.set("dashboard_confetti_shown", "true", { expires: 30 });

    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, [pathname, isSignedIn, isLoaded]);

  // No modal here anymore — the personalization questionnaire is launched
  // by the "Create Your First Image" CTA in dashboard/page.tsx.
  return null;
};

export default Onboarding;
