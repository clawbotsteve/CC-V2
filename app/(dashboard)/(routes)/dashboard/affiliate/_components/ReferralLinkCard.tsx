"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";


export function ReferralLinkCard() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cleanAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  const referralLink = referralCode
    ? `${cleanAppUrl}/referred/${referralCode}`
    : null;

  useEffect(() => {
    const fetchReferral = async () => {
      const res = await fetch("/api/referral/code");
      const data = await res.json();
      setReferralCode(data.code);
      setLoading(false);
    };
    fetchReferral();
  }, []);

  const createReferral = async () => {
    const res = await fetch("/api/referral/code/create", { method: "POST" });
    const data = await res.json();
    setReferralCode(data.code);
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow mb-6">
      <div className="flex flex-col space-y-1.5 p-4 sm:p-6"> {/* Responsive padding */}
        <h1 className="font-semibold leading-none tracking-tight text-base sm:text-lg"> {/* Responsive text */}
          Your Affiliate Link
        </h1>
        <p>Share this link to earn 20% commission on all referred purchases</p>
      </div>

      <div className="p-4 sm:p-6 pt-0">
        {loading ? (
          <p className="text-muted-foreground text-sm sm:text-base">Loading...</p>
        ) : referralLink ? (
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <code className="flex-1 bg-muted p-3 rounded text-xs sm:text-sm break-all"> {/* Smaller text on mobile */}
              {referralLink}
            </code>
              <CopyButton text={referralLink} className="shrink-0 sm:h-auto"/>
          </div>
        ) : (
          <Button
            onClick={createReferral}
            className="w-full sm:w-auto" /* Full width on mobile */
            size="sm"
          >
            Generate Referral Code
          </Button>
        )}
      </div>
    </div>
  );
}
