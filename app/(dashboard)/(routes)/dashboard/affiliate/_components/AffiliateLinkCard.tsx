"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

export function AffiliateLinkCard() {
  const [affiliateString, setAffiliateString] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coregen.ai";
  // Ensure URL has protocol and remove trailing slash
  let cleanAppUrl = appUrl.replace(/\/$/, "");
  if (!cleanAppUrl.startsWith("http://") && !cleanAppUrl.startsWith("https://")) {
    cleanAppUrl = `https://${cleanAppUrl}`;
  }
  const affiliateLink = affiliateString
    ? `${cleanAppUrl}?affiliate=${affiliateString}`
    : null;

  useEffect(() => {
    const fetchAffiliateString = async () => {
      try {
        const res = await fetch("/api/affiliate/string");
        const data = await res.json();
        setAffiliateString(data.affiliateString);
      } catch (err) {
        console.error("Failed to fetch affiliate string:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAffiliateString();
  }, []);

  const handleCopy = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          Share this link to earn $5.00 and 50 credits for each referral that subscribes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border">
          <code className="flex-1 text-sm break-all">{affiliateLink || "Generating..."}</code>
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
        </div>
        <div className="text-sm text-muted-foreground">
          <p>• Cookie expires in 90 days</p>
          <p>• You earn rewards when referred users subscribe to any paid plan</p>
        </div>
      </CardContent>
    </Card>
  );
}

