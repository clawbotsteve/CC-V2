// components/DownloadButton.tsx
"use client";

import { Download, Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DownloadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fileUrl: string;
  fileName?: string;
  defaultExtension?: string;
}

export const DownloadButton = forwardRef<
  HTMLButtonElement,
  DownloadButtonProps
>(
  (
    {
      fileUrl,
      fileName,
      defaultExtension = "jpg",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
      if (!fileUrl || loading) return;

      setLoading(true);

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file");

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        let extension = defaultExtension;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("/")) {
          extension = contentType.split("/").pop() || defaultExtension;
        } else {
          extension =
            fileUrl.split(".").pop()?.split(/[#?]/)[0] || defaultExtension;
        }

        const downloadName = fileName
          ? fileName.endsWith(`.${extension}`)
            ? fileName
            : `${fileName}.${extension}`
          : `download-${Date.now()}.${extension}`;

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = downloadName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (error) {
        console.error("Download failed:", error);
        // Cross-origin fetch failed — almost certainly R2's pub-*.r2.dev
        // not sending CORS headers. Route through our server-side proxy
        // (/api/download) which re-streams the asset with the proper
        // Content-Disposition header so the browser downloads it
        // instead of opening it inline. See app/api/download/route.ts.
        //
        // IMPORTANT: sniff the URL extension before falling back to
        // `defaultExtension`. Previously this path went straight to
        // `defaultExtension` (which was "jpg" at the component level
        // and rarely overridden), so a video URL like
        //   https://r2.../foo.mp4
        // would download as `download-<ts>.jpg` on any CORS failure —
        // unplayable. Sniffing the URL first keeps mp4/png/etc intact.
        const urlExt = fileUrl
          .split("?")[0]
          .split("#")[0]
          .split(".")
          .pop()
          ?.toLowerCase();
        const knownExts = new Set([
          "mp4", "mov", "webm", "mkv",
          "jpg", "jpeg", "png", "gif", "webp", "avif",
          "mp3", "wav", "m4a",
          "pdf",
        ]);
        const ext = urlExt && knownExts.has(urlExt) ? urlExt : defaultExtension;
        const downloadName =
          fileName || `download-${Date.now()}.${ext}`;
        const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(downloadName)}`;
        const link = document.createElement("a");
        link.href = proxyUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        setLoading(false);
      }
    };

    return (
      <button
        ref={ref}
        onClick={handleDownload}
        disabled={loading}
        className={cn(
          "inline-flex items-center justify-center text-black bg-white/80 hover:bg-white/60 h-8 w-8 p-0 rounded-md",
          loading && "cursor-not-allowed opacity-70",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          children || <Download className="h-4 w-4" />
        )}
      </button>
    );
  }
);

DownloadButton.displayName = "DownloadButton";
