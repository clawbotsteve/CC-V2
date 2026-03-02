"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileX } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileSizeErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
  fileName?: string;
  fileSize?: number; // in bytes
  maxSize?: number; // in bytes
}

export function FileSizeErrorModal({
  open,
  onOpenChange,
  error,
  fileName,
  fileSize,
  maxSize = 5 * 1024 * 1024, // Default 5MB
}: FileSizeErrorModalProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const maxSizeFormatted = formatFileSize(maxSize);
  const fileSizeFormatted = fileSize ? formatFileSize(fileSize) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div
          className={cn(
            "bg-gradient-to-r from-indigo-500 to-violet-600 p-6 text-white",
            "dark:from-indigo-600 dark:to-violet-700"
          )}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-white/20 p-2">
                <FileX className="h-6 w-6" strokeWidth={2} />
              </div>
              <DialogTitle className="text-white text-xl">
                File Too Large
              </DialogTitle>
            </div>
          </DialogHeader>

          <DialogDescription className="text-white/90 mt-2">
            The file you're trying to upload exceeds the maximum allowed size.
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-destructive">
                Upload Failed
              </p>
              <p className="text-sm text-foreground/80">{error}</p>
            </div>
          </div>

          {/* File Details */}
          {fileName && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm font-medium text-foreground/70">
                  File Name:
                </span>
                <span className="text-sm text-foreground font-mono truncate ml-2 max-w-[200px]">
                  {fileName}
                </span>
              </div>

              {fileSizeFormatted && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium text-foreground/70">
                    File Size:
                  </span>
                  <span className="text-sm text-foreground font-semibold">
                    {fileSizeFormatted}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm font-medium text-foreground/70">
                  Maximum Size:
                </span>
                <span className="text-sm text-foreground font-semibold text-primary">
                  {maxSizeFormatted}
                </span>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground/80">
              <strong className="text-foreground">Tip:</strong> Try compressing
              your images or reducing their resolution to meet the size
              requirement.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
