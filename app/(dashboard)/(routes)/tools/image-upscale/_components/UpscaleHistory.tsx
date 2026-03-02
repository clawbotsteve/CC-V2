"use client";

import { ImageIcon } from "lucide-react";
import { Upscaled } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RefObject, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { UpscaleCard } from "./UpscaleCard";

interface UpscaleHistoryProps {
  history: Upscaled[];
  isLoading?: boolean;
  onDelete?: () => void;
  pollingRefs: RefObject<Record<string, NodeJS.Timeout>>;
}

export default function UpscaleHistory({
  history,
  isLoading = false,
  onDelete,
  pollingRefs,
}: UpscaleHistoryProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: history.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerWidth < 768 ? 350 : 400, // Smaller estimate for mobile
    overscan: 5, // Reduced overscan for mobile
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="px-0 sm:px-4 pt-9 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-xl border border-border p-4 md:p-5 shadow-sm"
          >
            {/* Header with scale and metadata */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-[100px] rounded-lg" />
              </div>

              {/* Metadata chips */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-[120px] rounded-full" />
                <Skeleton className="h-6 w-[100px] rounded-full" />
                <Skeleton className="h-6 w-[80px] rounded-full" />
              </div>
            </div>

            {/* Image placeholders */}
            <div className="flex flex-col md:flex-row gap-4">
              {[...Array(2)].map((_, k) => (
                <div key={k} className="relative w-full md:w-64 aspect-square">
                  <Skeleton className="w-full h-64 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="px-0 sm:px-4 pt-9 flex flex-col items-center justify-center text-center">
        <div className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] bg-muted rounded-full flex items-center justify-center mb-6">
          <ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No upscaling history yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4 px-4">
          Your upscaled images will appear here. Start by uploading an image and
          clicking "Upscale".
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div>
        <h2 className="text-lg font-semibold mb-5">
          {history.length} generations
        </h2>
      </div>

      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
          width: '100%',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = history[virtualRow.index];
          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`,
                width: "100%",
                paddingBottom: window.innerWidth < 768 ? '16px' : '24px', // Adjust spacing for mobile
              }}
            >
              <UpscaleCard
                item={item}
                onDelete={onDelete}
                pollingRefs={pollingRefs}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
