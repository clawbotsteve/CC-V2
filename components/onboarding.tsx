"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { destroyCookie, parseCookies } from "nookies";
import { Button } from "./ui/button";
import confetti from "canvas-confetti";
import { useUserContext } from "./layout/user-context";
import OnboardingSlideshow from "./onboard/Onboarding-Slideshow";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

const Onboarding = () => {
  const { isSignedIn, isLoaded } = useUser();
  const { meta } = useUserContext()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const pathname = usePathname();

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
  }

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

    // If cookie exists, don't run again
    if (Cookies.get("dashboard_confetti_shown")) return;

    // Mark as shown
    Cookies.set("dashboard_confetti_shown", "true", { expires: 30 }); // 30 days

    setShowOnboarding(true);

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
  }, [pathname, isSignedIn, isLoaded, meta]);

  return (
    <div>
      {showOnboarding && (
        <OnboardingSlideshow onClose={handleCloseOnboarding} />
      )}
    </div>
  );
};

export default Onboarding;
