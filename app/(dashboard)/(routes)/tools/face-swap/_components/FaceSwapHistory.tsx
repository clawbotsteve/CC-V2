"use client";

import {
  Users,
  Clock,
  Share2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FaceSwap } from "@prisma/client";
import { DownloadButton } from "@/components/download-button";
import { DeleteButton } from "@/components/delete-button";
import { BlurImage } from "@/components/blur-image";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefObject } from "react";

interface FaceSwapHistoryProps {
  images: FaceSwap[];
  isLoading?: boolean;
  onDelete?: () => void;
  pollingRefs: RefObject<Record<string, NodeJS.Timeout>>;
}

export function FaceSwapHistory({ images, isLoading = false, onDelete, pollingRefs }: FaceSwapHistoryProps) {
  const handleDelete = async (swapId: string) => {
    try {
      // Stop polling if active
      if (pollingRefs.current?.[swapId]) {
        clearInterval(pollingRefs.current[swapId]);
        delete pollingRefs.current[swapId];
      }

      const response = await fetch(`/api/tools/face-swap/${swapId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Face swap deleted successfully");
      onDelete?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete face swap");
    }
  };

  return (
    <div className="px-0 sm:px-4 pt-9">

      {/* Content Area - conditional rendering */}
      {isLoading ? (
        <div className="max-w-full space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-background rounded-xl border border-border p-4">
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-48 rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="aspect-square relative overflow-hidden rounded-xl">
                    <Skeleton className="h-64 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="max-w-full">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No face swaps yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Your face swap history will appear here once you create your first transformation.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-full space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-5">
              {images.length} generations
            </h2>
          </div>

          {images.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-background rounded-xl border border-border p-4 shadow-sm transition-all hover:shadow-md"
              )}
            >
              <div className="mb-4 flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-pink-500 flex-shrink-0" />
                    <div className="inline-flex items-center gap-1 max-w-[80%] bg-muted rounded-lg pl-2 pr-1 py-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        Face Swap
                      </p>
                      {item.upscale2x && (
                        <span className="text-xs bg-pink-500/10 text-pink-500 px-1.5 py-0.5 rounded">
                          2X
                        </span>
                      )}
                      {item.enableDetailer && (
                        <span className="text-xs bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded">
                          Detailer
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <span className="text-border/50">•</span>
                    <span
                      className={cn(
                        "capitalize",
                        item.status === "completed"
                          ? "text-green-500"
                          : item.status === "failed"
                            ? "text-red-500"
                            : "text-yellow-500"
                      )}
                    >
                      {item.status.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <DeleteButton
                  onConfirmDelete={() => handleDelete(item.id)}
                  title="Delete Face Swap"
                  description="Are you sure you want to delete this face swap? This action cannot be undone."
                  className="rounded-full bg-transparent text-destructive hover:text-destructive hover:bg-destructive/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* First Face */}
                {item.firstFace && (
                  <div className="relative group rounded-xl overflow-hidden shadow-lg">
                    <div className="aspect-square relative overflow-hidden rounded-xl">
                      <BlurImage
                        src={item.firstFace}
                        alt="First Face"
                        aspectRatio={4 / 3}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-medium">First Face</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Second Face - only show if exists */}
                {item.secondFace && (
                  <div className="relative group rounded-xl overflow-hidden shadow-lg">
                    <div className="aspect-square relative overflow-hidden rounded-xl">
                      <BlurImage
                        src={item.secondFace}
                        alt="Second Face"
                        aspectRatio={4 / 3}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-medium">Second Face</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result Image */}
                <div className="relative group rounded-xl overflow-hidden shadow-lg">
                  <div className="aspect-square relative overflow-hidden rounded-xl">
                    <BlurImage
                      src={item.swapedUrl as string}
                      alt="Result"
                      aspectRatio={4 / 3}
                    />
                    {/* Always visible action buttons */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex justify-between items-end">
                      <p className="text-white text-sm font-medium">Result</p>
                      {item.status === "completed" && (
                        <div className="flex gap-2">
                          <DownloadButton
                            fileUrl={item.swapedUrl as string}
                            aria-label="Download image"
                            className="h-8 w-8 p-0 text-white bg-white/20 hover:bg-white/30"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white bg-white/20 hover:bg-white/30"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
