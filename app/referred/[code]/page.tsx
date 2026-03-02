"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "nookies";

export default function ReferralRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development";

  React.useEffect(() => {
    console.log("[ReferralRedirectPage] useEffect triggered");
    console.log("[ReferralRedirectPage] Referral code:", code);

    if (code) {
      try {
        setCookie(null, "referralCode__ccai", JSON.stringify({
          code,
          expires: Date.now() + 24 * 60 * 60 * 1000,
        }), {
          maxAge: 60 * 60 * 24, // 1 day in seconds
          path: "/",
          secure: !isDev,
          sameSite: "lax",
          domain: isDev ? undefined : ".coregen.ai",
        });

        console.log("🍪 Referral cookie set via nookies");
      } catch (error) {
        console.error("❌ Failed to set referral cookie:", error);
      }

      const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up";

      console.log("➡️ Redirecting to:", signUpUrl);
      window.location.href = signUpUrl;
    } else {
      console.warn("⚠️ No referral code found in params");
    }
  }, [code, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting you to sign-up...</p>
    </div>
  );
}
