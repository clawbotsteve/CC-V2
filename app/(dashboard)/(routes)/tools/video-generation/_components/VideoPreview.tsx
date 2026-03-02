// components/video/VideoPreview.tsx
"use client";

import { Download, Clock, Sparkles } from "lucide-react";

export function VideoPreview({
  videoUrl,
  generationTime,
  creditUsed,
}: {
  videoUrl: string;
  generationTime: string | null;
  creditUsed: number;
}) {
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <video
        src={videoUrl}
        controls
        className="w-full max-w-2xl rounded-md shadow-lg"
      />
      <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" /> Generated in {generationTime}
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" /> {creditUsed} credits used
        </div>
        <a
          href={videoUrl}
          download
          className="inline-flex items-center gap-1 text-primary font-medium"
        >
          <Download className="h-4 w-4" /> Download
        </a>
      </div>
    </div>
  );
}
