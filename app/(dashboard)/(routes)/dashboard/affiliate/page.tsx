"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import PageContainer from "@/components/page-container";
import { AffiliateLinkCard } from "./_components/AffiliateLinkCard";
import { AffiliateStatsCards } from "./_components/AffiliateStatsCards";

export interface Referral {
  id: string;
  referredUserId: string;
  createdAt: string;
  planId: string | null;
  commission: number | null;
  referredUser: {
    name: string | null;
    createdAt: string;
  };
}

export default function AffiliateDashboard() {
  const [requestingPayout, setRequestingPayout] = useState(false);

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

      const data = await res.json();
      toast.success("Payout request submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to request payout");
      console.error("Payout request error:", error);
    } finally {
      setRequestingPayout(false);
    }
  };

  // const banners = [
  //   { src: "/coregen-banner.png", name: "coregen-banner.png" },
  //   { src: "/ai-influencer-banner.png", name: "ai-influencer-banner.png" },
  // ];

  // const handleDownload = async () => {
  //   const zip = new JSZip();

  //   // Fetch each image and add to zip
  //   await Promise.all(
  //     banners.map(async (banner, index) => {
  //       const res = await fetch(banner.src);
  //       const blob = await res.blob();
  //       const extension = banner.name.split(".").pop();
  //       zip.file(`image-${index + 1}.${extension}`, blob);
  //     })
  //   );

  //   // Generate ZIP file
  //   const zipBlob = await zip.generateAsync({ type: "blob" });
  //   const zipFile = new File([zipBlob], `banners.zip`, {
  //     type: "application/zip",
  //   });

  //   // Trigger download
  //   const link = document.createElement("a");
  //   link.href = URL.createObjectURL(zipFile);
  //   link.download = zipFile.name;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  // useEffect(() => {
  //   const fetchReferrals = async () => {
  //     try {
  //       const res = await fetch("/api/referral");
  //       const data = await res.json();

  //       setReferrals(data.referrals || []);
  //       setTotalReferred(data.totalReferredUsers || 0);
  //       setActiveBuyers(data.activeBuyers || 0);
  //       setTotalCommission(data.totalCommission || 0);
  //     } catch (err) {
  //       console.error("❌ Failed to load referrals:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchReferrals();
  // }, []);

  return (
    <PageContainer scrollable>
      <div className="w-full p-4 sm:p-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Affiliate Dashboard
          </h1>
          <p>Earn money by referring new users to CoreGen</p>
        </div>

        {/* Affiliate Stats */}
        <AffiliateStatsCards />

        {/* Affiliate Link */}
        <AffiliateLinkCard />

        {/* Request Payout */}
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

        {/* <div className="space-y-6 sm:space-y-8">
          <StatsCards
            totalReferredUsers={totalReferred}
            activeBuyers={activeBuyers}
            totalEarnings={totalCommission}
            loading={loading}
          />

          <ReferralLinkCard />
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:inline-flex h-auto sm:h-10 items-stretch justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1">
            <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 sm:py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
              Performance
            </TabsTrigger>
            <TabsTrigger value="payouts" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 sm:py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
              Payouts
            </TabsTrigger>
            <TabsTrigger value="marketing" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 sm:py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
              Marketing Material
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <ReferredUsersTable loading={loading} referrals={referrals} />
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4 sm:space-y-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <h3 className="text-base sm:text-lg font-semibold leading-none tracking-tight">
                  Payout Method
                </h3>
                <PayoutNoticeDialog />
              </div>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <p className="text-sm text-muted-foreground">No payout method set up yet</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <h3 className="text-base sm:text-lg font-semibold leading-none tracking-tight">Payout History</h3>
                <Button disabled size="sm" className="w-full sm:w-auto">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Request Payout
                </Button>
              </div>
              <div className="overflow-x-auto px-0 pb-4 sm:pb-6">
                <table className="w-full min-w-[300px] sm:min-w-[600px] divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="text-center py-6 sm:py-8 text-sm text-muted-foreground">No payout history yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-border bg-card w-full">
                <CardHeader>
                  <CardTitle>Banners</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Use these banners on your website or social media
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg overflow-hidden">
                      <img src="/coregen-banner.png" alt="Banner 1" className="w-full h-auto" />
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <img src="/ai-influencer-banner.png" alt="Banner 2" className="w-full h-auto" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download All Banners
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border border-border bg-card w-full">
                <CardHeader>
                  <CardTitle>Social Media Posts</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Ready-to-use content for your social media channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border border-border rounded-lg p-4 bg-muted">
                    <p className="text-sm mb-2">
                      🚀 Create stunning AI content in minutes with @CoreGen! I've been using it to generate amazing visuals. Use my link for a special discount: [Your Affiliate Link]
                    </p>
                    <CopyButton text={`🚀 Create stunning AI content in minutes with @CoreGen! Use my link: https://coregen.ai/?ref=realuser`} />
                  </div>
                  <div className="border border-border rounded-lg p-4 bg-muted">
                    <p className="text-sm mb-2">
                      💰 Save time and money on content creation with @CoreGen. Generate stunning photos and videos with AI! Check it out: [Your Affiliate Link]
                    </p>
                    <CopyButton text={`💰 Save time and money on content creation with @CoreGen. Check it out: [Your Affiliate Link]`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <ProgramDetails /> */}
      </div>
    </PageContainer>
  );
}
