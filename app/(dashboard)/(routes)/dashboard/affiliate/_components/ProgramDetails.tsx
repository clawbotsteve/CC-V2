import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, DollarSign, LinkIcon, TrendingUp } from "lucide-react";

export default function ProgramDetails() {
  return (
    <>
      {/* Program Details */}
      <Card className="border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Affiliate Program Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 20% Commission */}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="font-medium text-gray-800 dark:text-white">20% Commission</h3>
              <p className="text-sm text-gray-600 dark:text-white/70">
                Earn 20% of every purchase made by users you refer, including subscriptions and credit purchases
              </p>
            </div>

            {/* 90-Day Cookie */}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="font-medium text-gray-800 dark:text-white">90-Day Cookie</h3>
              <p className="text-sm text-gray-600 dark:text-white/70">
                Your referral link remains active for 90 days, giving you credit for delayed conversions
              </p>
            </div>

            {/* Monthly Payouts */}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="font-medium text-gray-800 dark:text-white">Monthly Payouts</h3>
              <p className="text-sm text-gray-600 dark:text-white/70">
                Get paid via PayPal or bank transfer once your earnings reach $50 or more
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full border-gray-300 dark:border-white/10 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 bg-transparent"
            asChild
          >
            <a href="#" target="_blank" rel="noopener noreferrer">
              Learn More About Our Affiliate Program
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
