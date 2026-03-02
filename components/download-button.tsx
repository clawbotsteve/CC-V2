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
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download =
          fileName || `download-${Date.now()}.${defaultExtension}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
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
