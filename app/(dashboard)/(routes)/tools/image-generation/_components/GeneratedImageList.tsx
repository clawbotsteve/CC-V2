"use client";
import React from "react";
import { AspectRatio, GeneratedImage } from "@prisma/client";
import ImageCard from "./ImageCard";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAspectClass } from "@/lib/utils";

export function GeneratedImageList({
  images,
  isLoading,
  onDelete,
  pollingRefs,
}: {
  images: GeneratedImage[];
  isLoading: boolean;
  onDelete?: () => void;
  pollingRefs: React.RefObject<Record<string, NodeJS.Timeout>>;
}) {
  // Loading state with skeleton matching ImageCard layout
  if (isLoading) {
    return (
      <div className="px-0 sm:px-4 pt-9">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-8 pb-16">
          {Array(8)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm"
              >
                {/* Image Container Skeleton */}
                <div className="relative w-full bg-muted/50 aspect-square sm:aspect-auto">
                  <Skeleton className="w-full h-64" />
                </div>

                {/* Content Area Skeleton */}
                <div className="flex flex-col p-3 sm:p-4 w-full space-y-3">
                  {/* Prompt Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>

                  {/* Footer Skeleton with Status Badge */}
                  <div className="flex items-center justify-between mt-auto">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full sm:hidden" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!images || images.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center px-0 sm:px-4 pt-9">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
          Start your first generation
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Pick a model, write a prompt, and click Generate Image.
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {[
            "Luxury skincare ad, soft window light, 4:5",
            "Streetwear portrait in Tokyo at night, cinematic",
            "Minimal product shot on marble table, studio lighting",
          ].map((prompt) => (
            <span key={prompt} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              {prompt}
            </span>
          ))}
        </div>
      </section>
    );
  }

  // Responsive image grid
  return (
    <div className="bg-background/50 backdrop-blur-md px-0 sm:px-4">
      <div>
        <h2 className="text-lg font-semibold mb-5">
          {images.length} generations
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-8 pb-16">
        {images.map((img) => (
          <ImageCard
            key={img.id}
            img={img}
            aspectClass={getAspectClass(img.aspectRatio as AspectRatio)}
            onDelete={onDelete}
            pollingRefs={pollingRefs}
          />
        ))}
      </div>
    </div>
  );
}
