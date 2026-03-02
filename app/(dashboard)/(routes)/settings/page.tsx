"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Check, CreditCard, Calendar, AlertCircle } from "lucide-react"
import PageContainer from "@/components/page-container"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { SubscriptionInfo } from "@/lib/subscription"
import { useUserContext } from "@/components/layout/user-context"
import { UserSubscriptionResponse } from "@/app/api/user/subscription/route"
import { PLAN_MAPS, PlanKey, TIER_KEY_MAP } from "@/constants/pricing-constants"
import { SubscriptionPlanList } from "../dashboard/get-credits/_components/SubscriptionPlanList"
import { SubscriptionButton } from "@/components/subscription-button"
import { PLAN_FREE } from "@/constants"

export default function SubscriptionsPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userId, plan, plans } = useUserContext();
  const currentPlan = PLAN_MAPS[TIER_KEY_MAP[subscription?.planName as PlanKey] as PlanKey] ?? PLAN_MAPS.Free;
  const [sub, setSub] = useState<UserSubscriptionResponse | null>(null)

  const fetchSubscription = async () => {
    if (!plans) {
      console.warn("Plans not loaded yet");
      setLoading(false);
      return;
    }

    try {
      const subscriptionResponse = await fetch('/api/user/subscription', { method: 'POST' });

      const subscriptionData: UserSubscriptionResponse = await subscriptionResponse.json();

      const currentPlan = plans.find(p => p.tier === plan);
      const price = currentPlan ? currentPlan.price : null;

      setSubscription({
        planName: plan!,
        price: price!.toString(),
        startDate: new Date(),
        nextBillingDate: subscriptionData.phyziroCurrentPeriodEnd!,
        status: subscriptionData.status
      });
      setHasActiveSubscription(subscriptionData?.hasActiveSubscription ?? false);

      setSub(subscriptionData)
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [userId, plan, plans]);


  return (
    <PageContainer>
      <div className="w-full p-4 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Manage Subscription</h1>
          <p className="text-foreground/70">View and manage your subscription plan</p>
        </div>

        {/* Current Subscription */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Current Subscription</h2>
          <Card className="border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{currentPlan.name}</h3>
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/20">
                      Active
                    </Badge>
                  </div>
                  <p className="text-foreground/70 mb-4">
                    {/* You are being billed {currentSubscription.price} {currentSubscription.billingCycle} */}
                  </p>
                  <div className="flex items-center gap-4 text-sm">

                    {subscription && plan !== PLAN_FREE && (
                      <div className="flex items-center gap-1 text-foreground/70">
                        <Calendar className="h-4 w-4" />

                        <time
                          dateTime={new Date(subscription.nextBillingDate).toISOString()}
                          className="text-primary font-semibold"
                        >
                          {format(new Date(subscription.nextBillingDate), 'PPP')}
                        </time>
                      </div>
                    )}

                    {/* <div className="flex items-center gap-1 text-amber-400">
                      <Star className="h-4 w-4" />
                      <span>600 credits/month</span>
                    </div> */}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="hidden border-foreground/10 text-foreground hover:bg-white/10 bg-transparent">
                    Update Payment Method
                  </Button>
                  <Button
                    variant="destructive"
                    className="hidden border-foreground/10 text-foreground hover:bg-white/10">
                    Cancel Subscription
                  </Button>

                  <SubscriptionButton subscription={sub!} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SubscriptionPlanList />
          </div>
        </div>

        {/* Billing History */}
        <div className="space-y-4 hidden">
          <h2 className="text-lg font-medium">Billing History</h2>
          <Card className="border-white/10 bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  {
                    date: "August 5, 2025",
                    amount: "$69.99",
                    description: "Pro Plan - Monthly Subscription",
                    status: "Paid",
                  },
                  {
                    date: "July 5, 2025",
                    amount: "$69.99",
                    description: "Pro Plan - Monthly Subscription",
                    status: "Paid",
                  },
                  {
                    date: "June 5, 2025",
                    amount: "$69.99",
                    description: "Pro Plan - Monthly Subscription",
                    status: "Paid",
                  },
                ].map((invoice, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-white/10 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{invoice.description}</p>
                      <p className="text-sm text-white/70">{invoice.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">{invoice.amount}</p>
                      <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/20">
                        {invoice.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10 bg-transparent"
                      >
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cancellation Notice */}
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-indigo-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1">About Cancellation</h3>
                <p className="text-sm text-foreground/70">
                  When you cancel your subscription, your monthly credits will expire immediately. You'll be downgraded
                  to the Free plan, which means you'll lose access to NSFW content generation, video generation, and
                  receive only 30 credits per month instead of your current allowance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
