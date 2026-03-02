'use client';

import { useEffect, useState } from 'react';
import { Loader2, Settings } from 'lucide-react';
import { format } from 'date-fns';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionButton } from '@/components/subscription-button';
import { PLAN_MAPS, PlanKey, TIER_KEY_MAP } from '@/constants/pricing-constants';
import { SubscriptionInfo } from '@/lib/subscription';
import { useUserContext } from '@/components/layout/user-context';
import { UserSubscriptionResponse } from '@/app/api/user/subscription/route';
import SettingsPageSkeleton from './_components/SettingsPageSkeleton';
import ExtendSubscriptionButton from './_components/ExtendSubscriptionButton';

const SettingsPage = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userId, plan, plans } = useUserContext();

  const [sub, setSub] = useState<UserSubscriptionResponse | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!plans) {
        console.warn("Plans not loaded yet");
        setLoading(false);
        return;
      }

      try {
        const subRes = await fetch('/api/user/subscription', { method: 'POST' });

        const subData: UserSubscriptionResponse = await subRes.json();

        const currentPlan = plans.find(p => p.tier === plan);
        const price = currentPlan ? currentPlan.price : null;

        setSubscription({
          planName: plan!,
          price: price!.toString(),
          startDate: new Date(),
          nextBillingDate: subData.phyziroCurrentPeriodEnd!,
          status: subData.status
        });
        setHasActiveSubscription(subData?.hasActiveSubscription ?? false);

        setSub(subData)
      } catch (error) {
        console.error('Failed to fetch subscription info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId, plan, plans]);

  if (loading || !subscription) {
    return (
      <SettingsPageSkeleton />
    );
  }

  const currentPlan =
    PLAN_MAPS[
    TIER_KEY_MAP[subscription?.planName as PlanKey] as PlanKey
    ] ?? PLAN_MAPS.Free;

  return (
    <PageContainer scrollable>
      <div className="w-full flex items-center justify-center px-0">
        <Card className="w-full max-w-full border-0">
          <CardHeader>
            <Heading
              title="Settings"
              description="Manage your subscription here."
              icon={Settings}
              iconColor="text-indigo-700 dark:text-indigo-400"
              bgColor="bg-indigo-100 dark:bg-indigo-900/30"
            />
          </CardHeader>

          <CardContent className="flex flex-col items-center">

            <div className="mt-4 text-center mb-6 sm:mb-8 max-w-2xl">
              <div className="text-xl sm:text-3xl font-extrabold text-foreground flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-3">
                <span>{currentPlan.features[0]?.split(' ')[0]}</span>
                <span>
                  You're on the{' '}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {currentPlan.name}
                  </span>{' '}
                  Plan
                </span>
              </div>

              {subscription && (
                <div className="mt-2 text-muted-foreground text-xs sm:text-sm flex flex-col sm:flex-row justify-center items-center gap-1">
                  <span>
                    Subscribed on:{' '}
                    <time dateTime={new Date(subscription.startDate).toISOString()}>
                      {format(new Date(subscription.startDate), 'PPP')}
                    </time>
                  </span>
                  <span className="hidden sm:inline">&nbsp;|&nbsp;</span>
                  <span>
                    Next billing:{' '}
                    <time
                      dateTime={new Date(subscription.nextBillingDate).toISOString()}
                      className="text-primary font-semibold"
                    >
                      {format(new Date(subscription.nextBillingDate), 'PPP')}
                    </time>
                  </span>
                </div>
              )}
            </div>

            <Card className="border-primary bg-indigo-50 dark:bg-indigo-900/10 w-full max-w-2xl">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="text-xl sm:text-2xl">
                    {currentPlan.features[0]?.split(' ')[0]}
                  </div>
                  {currentPlan.recommended && <Badge variant="default">Recommended</Badge>}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                  {currentPlan.name}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">
                  {currentPlan.description}
                </p>
                <p className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-400 mb-3 sm:mb-4">
                  {subscription ? subscription.price : '$0.00/Monthly'}
                </p>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {currentPlan.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="max-w-2xl mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4">
              <SubscriptionButton subscription={sub!} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;
