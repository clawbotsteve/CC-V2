import { Clock, ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DownloadButton } from "@/components/download-button";
import { DeleteButton } from "@/components/delete-button";
import { GenerationStatus, ImageEdit } from "@prisma/client";
import { BlurImage } from "@/components/blur-image";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { RefObject } from "react";

type ImageHistoryProps = {
  isLoading: boolean;
  images: ImageEdit[];
  onDelete?: () => void;
  pollingRefs: RefObject<Record<string, NodeJS.Timeout>>;
};

export function ImageHistory({ isLoading, images, onDelete, pollingRefs }: ImageHistoryProps) {
  const statusColors = {
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400",
    processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    queued: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };

  const { resolvedTheme: theme } = useTheme();

  const handleDelete = async (editId: string) => {
    try {
      // Stop polling if active
      if (pollingRefs.current?.[editId]) {
        clearInterval(pollingRefs.current[editId]);
        delete pollingRefs.current[editId];
      }

      const response = await fetch(`/api/tools/editor/${editId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Image edit deleted successfully");
      onDelete?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete image edit");
    }
  };

  const state = isLoading ? "loading" : images.length ? "loaded" : "empty";

  if (state === "empty") {
    return (
      <div className="flex flex-col items-center justify-center px-0 sm:px-4 pt-9 text-center">
        <div className="w-[150px] h-[150px] bg-muted rounded-full flex items-center justify-center mb-6">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No edits yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          Upload an image and make your first edit to see results here.
        </p>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="max-w-full px-0 sm:px-4 pt-9 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-xl border border-border p-4 md:p-5 shadow-sm"
          >
            <div className="mb-4 space-y-3">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="w-full md:w-64 h-64 rounded-xl" />
              <Skeleton className="w-full md:w-64 h-64 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-5">
          {images.length} generations
        </h2>
      </div>

      {images.map((img) => (
        <div
          key={img.id}
          className="bg-none rounded-xl border border-border p-4 md:p-5 shadow-sm transition-all hover:shadow-md"
        >

          {/* header */}
          <div className="mb-4 flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-500 flex-shrink-0" />
                <div className="inline-flex items-center gap-1 max-w-[80%] bg-muted rounded-lg px-3 py-1">
                  <p className="text-sm font-medium text-foreground break-words whitespace-normal">
                    {img.prompt}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(img.generationTime).toLocaleString()}
                </span>
                <span className="text-foreground/50">•</span>

                <div className="relative">
                  <Badge className={cn(
                    "text-xs font-medium capitalize hover:bg-transparent",
                    statusColors[img.status] || statusColors.queued
                  )}>
                    {img.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <DeleteButton
              onConfirmDelete={() => handleDelete(img.id)}
              title="Delete Image Edit"
              description="Are you sure you want to delete this image edit? This action cannot be undone."
              className="rounded-full bg-transparent text-destructive hover:text-destructive hover:bg-destructive/20 transition"
            />
          </div>

          {/* body */}
          <div className="flex flex-col md:flex-row gap-4 rounded-xl bg-none">
            {[
              { label: "Original", url: img.originalUrl },
              { label: "Edited", url: img.editedUrl, showDownload: img.status === "completed" },
            ].map((image, index) => (
              <MagicCard
                key={index}
                gradientColor={theme === "dark" ? "#262626" : "#D9D9D9"}
                className="p-0"
              >
                <div className="relative group overflow-hidden shadow-lg w-full md:w-64 bg-none">
                  <div className="aspect-square relative overflow-hidden rounded-xl p-2">
                    <BlurImage
                      src={image.url}
                      alt={`${image.label} image`}
                      aspectRatio={4 / 3}
                    />
                  </div>
                  <div className="p-3 flex justify-between items-center bg-none">
                    <p className="text-white text-sm font-medium">{image.label}</p>
                    {image.showDownload && (
                      <DownloadButton
                        fileUrl={image.url}
                        className="text-white bg-white/20 hover:bg-white/30 h-8 w-8 p-0"
                      />
                    )}
                  </div>
                </div>
              </MagicCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}
