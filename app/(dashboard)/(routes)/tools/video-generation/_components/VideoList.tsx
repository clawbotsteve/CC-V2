import React, { useState } from "react";
import { Sparkles, Clock, Video, Download, Info, AlertTriangleIcon } from "lucide-react";
import { GeneratedVideo } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { DownloadButton } from "@/components/download-button";
import { Button } from "@/components/ui/button";
import { Player } from "@/components/vidstack/player";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DeleteButton } from "@/components/delete-button";
import { toast } from "sonner";

interface VideoListProps {
  videos: GeneratedVideo[];
  isLoading?: boolean;
  onDelete: () => void;
  pollingRefs: React.RefObject<Record<string, NodeJS.Timeout>>;
}

interface VideoError {
  code: string;
  reason: string;
}

export function VideoList({ videos, isLoading = false, onDelete, pollingRefs }: VideoListProps) {
  const [videoError, setVideoError] = useState(false);

  const handleDelete = async (videoId: string) => {
    try {
      const response = await fetch(`/api/tools/video/${videoId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete Video");
      }
      
      if(pollingRefs.current[videoId]){
        clearInterval(pollingRefs.current[videoId]);
        delete pollingRefs.current[videoId];
      }

      onDelete?.();

      toast.success("Video deleted successfully");
    }
    catch (error : any) {
      console.error("Video Delete failed:", error);
      toast.error( error.message || "Failed to delete video");
    }
  }


  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 pt-9 px-0 sm:px-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-xl border border-border p-4 md:p-5 shadow-sm"
          >
            <div className="mb-4 space-y-3">
              <Skeleton className="h-4 w-[200px]" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-[120px] rounded-full" />
                <Skeleton className="h-6 w-[80px] rounded-full" />
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                <Skeleton className="w-full h-full rounded-xl" />
              </AspectRatio>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="max-w-full flex flex-col items-center justify-center text-center px-0 sm:px-4 pt-9">
        <div className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] bg-muted rounded-full flex items-center justify-center mb-6">
          <Video className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No videos generated yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          Your generated videos will appear here. Start by creating your first video.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-5">
          {videos.length} generations
        </h2>
      </div>

      {videos.map((item: GeneratedVideo) => {
        const videoError = item.reason as any as VideoError[]

        return (
          <div
            key={item.id}
            className="bg-background rounded-xl border border-border p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-4 space-y-2">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <div className="inline-flex items-center gap-1 max-w-[80%] bg-muted rounded-lg px-3 py-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.prompt}
                    </p>
                  </div>
                </div>
                <DeleteButton 
                  onConfirmDelete={() => handleDelete(item.id)} 
                  className="rounded-full bg-transparent text-destructive hover:text-destructive hover:bg-destructive/20 transition"
                  title="Delete Video"
                  description="Are you sure you want to delete this video? This action cannot be undone."
                  />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <span className="text-border/50">•</span>
                <Video className="h-3.5 w-3.5" />
                <span className={cn(
                  "capitalize",
                  item.status === "completed" ? "text-green-500" :
                    item.status === "failed" ? "text-red-500" : "text-yellow-500"
                )}>
                  {item.status.toLowerCase()}
                </span>


                {videoError?.length > 0 && videoError?.[0].reason && (
                  <>
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
                        <p className="text-sm text-foreground break-words whitespace-normal">
                          <span className="text-red-700 font-bold">{videoError?.[0].code}</span> : {videoError?.[0].reason}
                        </p>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden">
              {/* <AspectRatio ratio={16 / 9}> */}
              {item.videoUrl ? (
                <>
                  {!videoError ? (
                    <>
                      <div className="aspect-video w-full sm:max-w-md md:max-w-xl lg:max-w-3xl">
                        <Player
                          src={item.videoUrl}
                          // poster="/assets/poster.png"
                          title={item.prompt}
                          showMuteButton={false}
                          download={item.status === "completed" ? item.videoUrl : ""}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-64 bg-muted rounded-md text-center text-sm text-red-500 px-4">
                      <p className="font-medium mb-2">Failed to load video</p>
                      <p className="text-muted-foreground text-xs">
                        The video could not be played. Please check your internet connection or try reloading the page.
                      </p>
                    </div>
                  )}

                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted gap-2">
                  {item.status === "failed" ? (
                    <div className="min-h-80 flex flex-col items-center justify-center">
                      <AlertTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-600 dark:text-red-400">Generation failed</span>
                    </div>
                  ) : (
                    <>
                      <Video className="h-8 w-8 animate-pulse" />
                      <span className="text-sm">Video processing...</span>
                    </>
                  )}
                </div>
              )}
              {/* </AspectRatio> */}
            </div>
          </div>
        )
      })}
    </div>
  );
}
