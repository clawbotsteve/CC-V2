"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

interface AffiliateInfo {
  affiliateString: string | null;
  commissionType: string;
  commissionRate: number;
}

export function AffiliateLinkCard() {
  const [info, setInfo] = useState<AffiliateInfo>({
    affiliateString: null,
    commissionType: "percentage",
    commissionRate: 15,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coregen.ai";
  let cleanAppUrl = appUrl.replace(/\/$/, "");
  if (!cleanAppUrl.startsWith("http://") && !cleanAppUrl.startsWith("https://")) {
    cleanAppUrl = `https://${cleanAppUrl}`;
  }
  const affiliateLink = info.affiliateString
    ? `${cleanAppUrl}?affiliate=${info.affiliateString}`
    : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stringRes, statsRes] = await Promise.all([
          fetch("/api/affiliate/string"),
          fetch("/api/affiliate/stats"),
        ]);

        const stringData = stringRes.ok ? await stringRes.json() : {};
        const statsData = statsRes.ok ? await statsRes.json() : {};

        setInfo({
          affiliateString: stringData.affiliateString || null,
          commissionType: statsData.commissionType || "percentage",
          commissionRate: statsData.commissionRate ?? 15,
        });
      } catch (err) {
        console.error("Failed to fetch affiliate info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const commissionLabel =
    info.commissionType === "percentage"
      ? `${info.commissionRate}% of each sale`
      : `$${info.commissionRate.toFixed(2)} per sale`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Link</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Affiliate Link</CardTitle>
        <CardDescription>
          Share this link to earn <strong>{commissionLabel}</strong> when referred users subscribe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border">
          <code className="flex-1 text-sm break-all">
            {affiliateLink || "No affiliate link yet"}
          </code>
          {affiliateLink && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Cookie expires in 90 days</p>
          <p>• You earn commission when referred users subscribe to any paid plan</p>
          <p>• Your commission rate: <strong>{commissionLabel}</strong></p>
        </div>
      </CardContent>
    </Card>
  );
}
