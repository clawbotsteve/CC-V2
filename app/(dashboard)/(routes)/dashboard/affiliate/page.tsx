"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import PageContainer from "@/components/page-container";
import { AffiliateLinkCard } from "./_components/AffiliateLinkCard";
import { AffiliateStatsCards } from "./_components/AffiliateStatsCards";
import { AffiliateLanding } from "./_components/AffiliateLanding";

type ViewState = "loading" | "landing" | "dashboard";

export default function AffiliatePage() {
  const [view, setView] = useState<ViewState>("loading");
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    const checkAffiliate = async () => {
      try {
        const res = await fetch("/api/affiliate/string");
        if (!res.ok) {
          setView("landing");
          return;
        }
        const data = await res.json();
        setView(data.affiliateString ? "dashboard" : "landing");
      } catch {
        setView("landing");
      }
    };
    checkAffiliate();
  }, []);

  const handleRequestPayout = async () => {
    setRequestingPayout(true);
    try {
      const res = await fetch("/api/affiliate/payout/request", {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to request payout");
      }

      toast.success("Payout request submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to request payout");
    } finally {
      setRequestingPayout(false);
    }
  };

  if (view === "loading") {
    return (
      <PageContainer scrollable>
        <div className="w-full p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  if (view === "landing") {
    return (
      <PageContainer scrollable>
        <div className="w-full p-4 sm:p-6 max-w-3xl mx-auto">
          <AffiliateLanding onJoined={() => setView("dashboard")} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="w-full p-4 sm:p-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Affiliate Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your earnings and manage your affiliate link
          </p>
        </div>

        <AffiliateStatsCards />
        <AffiliateLinkCard />

        <Card>
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
            <CardDescription>
              Request a payout for your affiliate earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRequestPayout}
              disabled={requestingPayout}
              className="w-full sm:w-auto"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {requestingPayout ? "Processing..." : "Request Payout"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
