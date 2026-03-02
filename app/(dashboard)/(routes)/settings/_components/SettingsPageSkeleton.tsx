'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Settings } from 'lucide-react';
import Heading from '@/components/heading';
import PageContainer from '@/components/page-container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const SettingsPageSkeleton = () => {
  return (
    <PageContainer scrollable>
      <div className="w-full flex items-center justify-center px-0">
        <Card className="w-full max-w-full border-0">
          <CardHeader>
            <Heading
              title="Settings"
              description="Manage your subscription here"
              icon={Settings}
              iconColor="text-indigo-700 dark:text-indigo-400"
              bgColor="bg-indigo-100 dark:bg-indigo-900/30"
            />
          </CardHeader>

          <CardContent className="flex flex-col items-center">
            <div className="mt-4 text-center mb-6 sm:mb-8 max-w-2xl space-y-2">
              <Skeleton className="h-10 w-full max-w-md mx-auto" />
              <Skeleton className="h-5 w-64 max-w-full mx-auto" />
            </div>

            <Card className="border-primary bg-indigo-50 dark:bg-indigo-900/10 w-full max-w-2xl">
              <CardContent className="pt-4 sm:pt-6 space-y-4">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>

                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-32" />
                <ul className="space-y-1 list-disc list-inside">
                  {[...Array(5)].map((_, idx) => (
                    <li key={idx}>
                      <Skeleton className="h-4 w-full max-w-xl" />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="max-w-2xl mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4 w-full px-4 sm:px-0">
              {/* Action button placeholders */}
              <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
              <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default SettingsPageSkeleton;
