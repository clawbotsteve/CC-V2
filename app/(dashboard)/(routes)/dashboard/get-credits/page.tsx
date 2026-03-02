"use client";

import { Sparkles, Check, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/page-container";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useProModal } from "@/hooks/use-pro-modal";
import { useUserContext } from "@/components/layout/user-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditPackCard } from "./_components/CreditPackCard";
import { SubscriptionPlanList } from "./_components/SubscriptionPlanList";

interface UserSubscriptionResponse {
  hasActiveSubscription: boolean;
  phyziroSubscriptionId: string | null;
  phyziroCurrentPeriodEnd: Date | null;
  status: string;
}

const CREDITS = [
  {
    id: "starter-50",
    price: 10,
    credits: 50,
    title: "Starter Pack",
    note: "Get 50 credits to explore basic features.",
  },
  {
    id: "creator-139",
    price: 25,
    credits: 139,
    title: "Creator Boost",
    note: "Perfect for growing creators needing more content.",
  },
  {
    id: "pro-350",
    price: 50,
    credits: 350,
    popular: true,
    title: "Pro Bundle",
    note: "Best value for active creators — 350 credits included.",
  },
  {
    id: "elite-800",
    price: 100,
    credits: 800,
    title: "Elite Access",
    note: "Unlock serious creative power with 800 credits.",
  },
  {
    id: "master-2381",
    price: 250,
    credits: 2381,
    title: "Master Vault",
    note: "For top-tier creators. Ultimate access, 2381 credits.",
  },
]

export default function GetCreditsPage() {
  const { plan, userId, availableCredit } = useUserContext();
  const proModal = useProModal();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const subscriptionResponse = await fetch('/api/user/subscription', { method: 'POST' });
        const subscriptionData: UserSubscriptionResponse = await subscriptionResponse.json();
        setHasActiveSubscription(subscriptionData?.hasActiveSubscription ?? false);
      } catch (error) {
        console.error('Failed to fetch subscription info:', error);
        setHasActiveSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  const handleUpgrade = () => {
    proModal.onOpen();
  };

  return (
    <PageContainer>
      <div className="w-full p-4 space-y-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-foreground">Get Credits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchase credits to use with our AI tools
          </p>
        </div>

        {hasActiveSubscription && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                You currently have {availableCredit ?? 0} credit{availableCredit !== 1 ? "s" : ""}
              </p>
              <p className="text-foreground/70 text-sm">Your credits expire every 30 days</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="credits" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="credits">Buy Credits</TabsTrigger>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="credits">
            {(plan === "plan_free") ? (
              // <PageContainer>
                <div className="w-full max-w-xl mx-auto text-center space-y-6">
                  <h1 className="text-3xl font-bold text-foreground">
                    Subscribe to Buy Credits
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    You must be on a paid plan to purchase gems.
                  </p>
                  <Button
                    onClick={handleUpgrade}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    Upgrade Plan
                    <Zap className="w-4 h-4 ml-2 fill-white" />
                  </Button>
                </div>
              // </PageContainer>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-5 gap-6">
                {CREDITS.map((pack) => (
                  <CreditPackCard key={pack.id} pack={pack} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="plans">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <SubscriptionPlanList />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
