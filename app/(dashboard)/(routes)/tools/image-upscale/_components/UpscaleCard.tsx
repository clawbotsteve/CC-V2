import { BlurImage } from "@/components/blur-image";
import { DownloadButton } from "@/components/download-button";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Share2, Clock, ArrowUpDown } from "lucide-react";
import { Upscaled } from "@prisma/client";
import { useInView } from "framer-motion";
import { RefObject, useRef } from "react";
import { toast } from "sonner";

interface UpscaleCardProps {
  item: Upscaled;
  onDelete?: () => void;
  pollingRefs: RefObject<Record<string, NodeJS.Timeout>>;
}

export function UpscaleCard({ item, onDelete, pollingRefs }: UpscaleCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "100px" });

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const normalized = url.toLowerCase();
    return normalized.includes(".mp4") || normalized.includes(".webm") || normalized.includes(".mov") || normalized.includes("video");
  };

  const statusClasses = {
    completed: "bg-green-500/10 text-green-600",
    failed: "bg-red-500/10 text-red-600",
    queued: "bg-yellow-500/10 text-yellow-600",
    processing: "bg-blue-500/10 text-blue-600",
  };

  const handleDelete = async () => {
    try {
      // Stop polling if active
      if (pollingRefs.current?.[item.id]) {
        clearInterval(pollingRefs.current[item.id]);
        delete pollingRefs.current[item.id];
      }

      const response = await fetch(`/api/tools/upscale/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Upscaled image deleted successfully");
      onDelete?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete upscaled image");
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "bg-background rounded-xl border border-border p-4 md:p-5 shadow-sm transition-shadow",
        isInView ? "hover:shadow-md" : ""
      )}
    >
      <div className="mb-4 flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-pink-500 flex-shrink-0" />
            <div className="inline-flex items-center gap-1 max-w-[80%] bg-muted rounded-lg px-3 py-1">
              <p className="text-sm font-medium text-foreground truncate">
                Upscale {item.scale}x
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {new Date(item.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
              <span className="text-muted-foreground">Creativity:</span>
              <span className="font-medium text-foreground">
                {item.creativity}
              </span>
            </div>

            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1",
                statusClasses[item.status] || ""
              )}
            >
              <span className="capitalize font-medium">{item.status}</span>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <DeleteButton
          onConfirmDelete={handleDelete}
          title="Delete Upscaled Image"
          description="Are you sure you want to delete this upscaled image? This action cannot be undone."
          className="rounded-full bg-transparent text-destructive hover:text-destructive hover:bg-destructive/20 transition"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Original Media */}
        <div className="relative rounded-xl overflow-hidden shadow-lg w-full md:w-64 aspect-square bg-black">
          {isVideoUrl(item.originalImage) ? (
            <video src={item.originalImage} className="h-full w-full object-cover" controls muted playsInline />
          ) : (
            <BlurImage
              src={item.originalImage}
              aspectRatio={4 / 3}
              alt="Original"
              className="rounded-xl"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm font-medium">Original</p>
          </div>
        </div>

        {/* Upscaled Media */}
        <div className="relative rounded-xl overflow-hidden shadow-lg w-full md:w-64 aspect-square bg-black">
          {isVideoUrl(item.upscaledImage) ? (
            <video src={item.upscaledImage} className="h-full w-full object-cover" controls playsInline />
          ) : (
            <BlurImage
              src={item.upscaledImage}
              aspectRatio={4 / 3}
              alt={`Upscaled ${item.scale}x`}
              className="rounded-xl"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex justify-between items-end">
            <p className="text-white text-sm font-medium">Upscaled</p>
            {item.status === "completed" && (
              <div className="flex gap-2">
                <DownloadButton
                  fileUrl={item.upscaledImage}
                  aria-label="Download upscaled output"
                  className="h-8 w-8 p-0 text-white bg-white/20 hover:bg-white/30"
                >
                  <Download className="h-4 w-4" />
                </DownloadButton>
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
  );
}
