"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomInIcon, X } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { GeneratedImage } from "@prisma/client";
import { ExtendedImage } from "@/types/image";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function ImageFullscreenPreview({ img }: { img: GeneratedImage }) {
  const [open, setOpen] = useState(false);
  let variants: ExtendedImage[] = Array.isArray(img?.images) ? (img.images as any as ExtendedImage[]) : [];

  if (variants.length === 0 && img?.imageUrl) {
    variants = [{ url: img.imageUrl, width: 0, height: 0, is_nsfw: false, content_type: "unknown" }];
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          aria-label="Fullscreen view"
          className="absolute top-2 right-2 z-10 border-none rounded-full p-0 w-8 h-8 text-white/75 bg-black/50 hover:bg-black/40 hover:text-white transition"
        >
          <ZoomInIcon className="h-4 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-foreground/75 dark:bg-background/10 text-white p-6 sm:p-8 w-full max-w-6xl h-[90vh] flex flex-col sm:flex-row gap-6 rounded-lg">

        {variants?.length > 0 && (
          <div
            className={cn(
              "grid gap-2 p-2 md:w-2/3",
              variants.length === 1 && "grid-cols-1",
              variants.length === 2 && "grid-cols-2",
              variants.length === 3 && "grid-cols-2",
              variants.length >= 4 && "grid-cols-2 grid-rows-2"
            )}
          >
            {variants.slice(0, 4).map((variant, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-md overflow-hidden",
                  variants.length === 3 && index === 2 && "col-span-2"
                )}
              >
                <div
                  className="relative w-full min-h-60 md:h-full bg-foreground/10">
                  <Image
                    src={variant.url}
                    alt={`Variant ${index + 1}`}
                    fill
                    className="object-contain rounded-md"
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Info Section */}
        <div className="w-full md:w-1/3 sm:w-80 bg-background/75 dark:bg-background/45 p-4 rounded-lg flex flex-col text-sm overflow-y-auto max-h-full">
          <DialogTitle className="text-lg text-foreground font-semibold mb-4">Image Details</DialogTitle>
          <ul className="space-y-3 text-foreground">
            <li>
              <span className="font-medium">Prompt:</span>
              <p className="text-foreground">{img.prompt}</p>
            </li>
            <li>
              <span className="font-medium">Aspect Ratio:</span> {img.aspectRatio || "N/A"}
            </li>
            <li>
              <span className="font-medium">Content Type:</span> {img.contentType}
            </li>
            <li>
              <span className="font-medium">Variant:</span> {img.variant}
            </li>
            <li>
              <span className="font-medium">Status:</span> {img.status}
            </li>
            <li>
              <span className="font-medium">Credit Used:</span> {img.creditUsed}
            </li>
            <li>
              <span className="font-medium">Generated:</span>{" "}
              {new Date(img.generationTime).toLocaleString()}
            </li>
            <li>
              <span className="font-medium">Created At:</span>{" "}
              {new Date(img.createdAt).toLocaleString()}
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
