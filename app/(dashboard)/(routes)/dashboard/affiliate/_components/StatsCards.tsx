"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalReferredUsers?: number;
  activeBuyers?: number;
  totalEarnings?: number;
  loading?: boolean;
}

export const StatsCards = ({
  totalReferredUsers,
  activeBuyers,
  totalEarnings,
  loading = false,
}: StatsCardsProps) => {
  const conversionRate = getConversionRate(totalReferredUsers, activeBuyers);

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Earnings */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <h3 className="text-2xl font-bold">
                {loading ? (
                  <DollarSign className="h-6 sm:h-8 w-6 sm:w-8 text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-bold">
                      ${(totalEarnings ?? 0).toFixed(2)}
                    </div>
                    <p className="text-[0.7rem] sm:text-xs text-muted-foreground mt-1">
                      Based on first purchases only
                    </p>
                  </>
                )}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Referrals */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <h3 className="text-2xl font-bold">
                {loading ? (
                  <Users className="h-6 sm:h-8 w-6 sm:w-8 text-muted-foreground" />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold">
                    {totalReferredUsers ?? 0}
                  </div>
                )}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <h3 className="text-2xl font-bold">{conversionRate}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getConversionRate = (
  totalReferredUsers?: number,
  activeBuyers?: number
): string => {
  if (!totalReferredUsers || totalReferredUsers === 0) return "0%";
  const rate = ((activeBuyers ?? 0) / totalReferredUsers) * 100;
  return `${rate.toFixed(2)}%`;
};
