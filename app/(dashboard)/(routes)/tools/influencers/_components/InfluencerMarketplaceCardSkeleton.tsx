"use client";

import { Skeleton } from "@/components/ui/skeleton"; // Assuming you're using shadcn/ui

export function InfluencerMarketplaceCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-lg max-w-sm">
      {/* Video/Avatar Skeleton */}
      <div className="relative aspect-video w-full bg-muted/30 flex-1 min-h-[400px]">
        <Skeleton className="absolute inset-0 h-full w-full" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col p-4 bg-card flex-grow">
        {/* Title + LoRA Tag */}
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-5 w-1/4 rounded-full" />
        </div>

        {/* Description snippet */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-4 w-4/6 rounded-md" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Buyers count */}
        <Skeleton className="h-3 w-1/2 rounded-md mb-4" />

        {/* Buy Button */}
        <Skeleton className="h-10 w-full rounded-md mt-auto" />

        {/* More details link */}
        <Skeleton className="h-4 w-20 rounded-md mt-3" />
      </div>
    </div>
  );
}
