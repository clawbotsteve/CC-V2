import { Clock, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DownloadButton } from "@/components/download-button";
import { DeleteButton } from "@/components/delete-button";
import { FaceEnhance } from "@prisma/client";
import { BlurImage } from "@/components/blur-image";
import { toast } from "sonner";

type ImageHistoryProps = {
  isLoading: boolean;
  images: FaceEnhance[];
  onDelete?: () => void;
  pollingRefs: React.RefObject<Record<string, NodeJS.Timeout>>;
};

export function ImageHistory({ isLoading, images, onDelete, pollingRefs }: ImageHistoryProps) {
  const handleDelete = async (imageId: string) => {
    try {
      if (pollingRefs.current && pollingRefs.current[imageId]) {
        clearInterval(pollingRefs.current[imageId]);
        delete pollingRefs.current[imageId];
      }

      const response = await fetch(`/api/tools/face-enhance/${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Face enhancement deleted successfully");
      onDelete?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete face enhancement");
    }
  };

  // Determine the current state
  const state = isLoading ? "loading" : images.length ? "loaded" : "empty";

  if (state === "empty") {
    return (
      <div className="flex flex-col items-center justify-center text-center px-0 sm:px-4 pt-9">
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
      <div className="px-0 sm:px-4 space-y-6 pt-9">
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
              <Skeleton className="w-full h-64 rounded-xl" />
              <Skeleton className="w-full h-64 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-5">
          {images.length} generations
        </h2>
      </div>

      {images.map((item) => (
        <div
          key={item.id}
          className="bg-background rounded-xl border border-border p-4 md:p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-4 flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(item.generationTime).toLocaleString()}
                </span>
                <span className="text-border/50">•</span>
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-border/50">•</span>
                <span className="capitalize">{item.status}</span>
              </div>
            </div>

            {/* Delete Button */}
            <DeleteButton
              onConfirmDelete={() => handleDelete(item.id)}
              title="Delete Face Enhancement"
              description="Are you sure you want to delete this face enhancement? This action cannot be undone."
              className="rounded-full bg-transparent text-destructive hover:text-destructive hover:bg-destructive/20 transition"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Original Image */}
            <div className="relative group rounded-xl overflow-hidden shadow-lg w-full">
              <div className="aspect-square relative overflow-hidden rounded-xl bg-black/5">
                <BlurImage
                  src={item.originalUrl}
                  alt="Original image"
                  aspectRatio={4 / 3}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-sm font-medium">Original</p>
              </div>
            </div>

            {/* Edited Image */}
            <div className="relative group rounded-xl overflow-hidden shadow-lg w-full">
              <div className="aspect-square relative overflow-hidden rounded-xl bg-black/5">
                <BlurImage
                  src={item.editedUrl}
                  alt="Edited image"
                  aspectRatio={4 / 3}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex justify-between items-end">
                <p className="text-white text-sm font-medium">Edited</p>
                {item.status === "completed" && (
                  <DownloadButton
                    fileUrl={item.editedUrl}
                    className="text-white bg-white/20 hover:bg-white/30 h-8 w-8 p-0"
                  />
                )}
              </div>
            </div>
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
