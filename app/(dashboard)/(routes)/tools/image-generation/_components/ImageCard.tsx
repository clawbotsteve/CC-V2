import { BlurImage } from "@/components/blur-image";
import { DownloadButton } from "@/components/download-button";
import { Badge } from "@/components/ui/badge";
import { GeneratedImage } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ImageFullscreenPreview } from "@/components/image-fullscreen-preview";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";
import ShareButton from "@/components/share-button";
import { ActionButton } from "@/components/action-buttton";
import { NormalizedError, parseReason } from "@/lib/normalize-fal-error";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtendedImage } from "@/types/image";
import { DeleteButton } from "@/components/delete-button";
import { useState } from "react";
import { toast } from "sonner";

export default function ImageCard({
  img,
  aspectClass,
  onDelete,
  pollingRefs,
}: {
  img: GeneratedImage;
  aspectClass: string;
  onDelete?: () => void;
  pollingRefs: React.RefObject<Record<string, NodeJS.Timeout>>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const statusColors = {
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400",
    processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    queued: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };
  const { resolvedTheme: theme } = useTheme()
  const hasErrorReason = parseReason(img.reason)
  const variants = img?.images as any as ExtendedImage[]

  const handleDelete = async () => {
    const imagId = img.id;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tools/image/${imagId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete image");
      }

      toast.success("Image deleted successfully");

      if(pollingRefs.current[imagId]){
        clearInterval(pollingRefs.current[imagId]);
        delete pollingRefs.current[imagId];
      }

      onDelete?.();
      
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="group relative overflow-hidden rounded-xl shadow-md transition-all hover:shadow-md">
      <MagicCard
        gradientColor={theme === "dark" ? "#262626" : "#D9D9D9"}
        className="p-0"
      >
        <div className="p-2">
          {/* Image Container */}
          <div className={cn("relative w-full bg-muted/50 overflow-hidden", aspectClass || "aspect-[3/4]")}>
            <BlurImage
              src={img.imageUrl}
              alt={img.prompt || "Generated image"}
              className="w-full h-full object-cover"
              aspectRatio={3 / 4}
              has_nsfw={hasErrorReason.length > 0 && hasErrorReason[0]?.code === 'nsfw_image'}
            />

            {img.status !== "failed" && (
              <ImageFullscreenPreview img={img} />
            )}

            {variants?.length > 0 && (
              <Badge
                variant="default"
                className="absolute bottom-2 right-2 z-10 bg-foreground/75 transition">
                {variants.length} {variants.length === 1 ? "variant" : "variants"}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <time
                className="text-xs text-muted-foreground"
                dateTime={new Date(img.createdAt).toISOString()}
              >
                {new Date(img.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>

              {/* Status Badge (always visible) */}
              <div className="relative">
                <Badge className={cn(
                  "text-xs font-medium capitalize hover:bg-transparent",
                  statusColors[img.status] || statusColors.queued
                )}>
                  {img.status}
                </Badge>
              </div>
            </div>

            {/* Row 2: Buttons right-aligned */}
            <div className="flex items-center gap-1">
              {img.status !== "failed" && (
                <>
                  <ShareButton
                    url={img.imageUrl}
                    className="rounded-full p-0 w-8 h-8 bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                  />

                  <DownloadButton fileUrl={img.imageUrl} className="rounded-full bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10 transition" />
                  <ActionButton imageUrl={img.imageUrl} />
                </>
              )}

              {(hasErrorReason.length > 0 && hasErrorReason[0].reason) && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-sm text-red-500 flex items-center gap-1 rounded-full py-1 h-auto"
                    >
                      Reason <Info className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-xs md:max-w-lg">
                    <p className="text-sm text-foreground break-words whitespace-normal">{hasErrorReason[0].reason}</p>
                  </PopoverContent>
                </Popover>
              )}
              <DeleteButton onConfirmDelete={handleDelete} className="rounded-full bg-transparent text-destructive hover:text-destructive hover:bg-destructive/20 transition" />
            </div>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
