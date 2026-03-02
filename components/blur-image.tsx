"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type BlurImageWithIconProps = {
  src: string;
  alt?: string;
  className?: string;
  aspectRatio?: number;
  has_nsfw?: boolean;
  has_error?: boolean;
};

export function BlurImage({
  src,
  alt = "",
  className,
  aspectRatio = 16 / 9,
  has_nsfw,
  has_error,
}: BlurImageWithIconProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <AspectRatio ratio={aspectRatio} className={cn("w-full", className)}>
      <div className="relative w-full h-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        {!loaded && !src && (
          has_nsfw ? (
            <AlertTriangle className="h-full w-8 text-red-500 z-10" />
          ) : (
            <ImageIcon className="h-full w-8 text-blue-500 z-10" />
          )
        )}

        {src && (
          <Image
            src={src}
            alt={alt}
            fill
            onLoad={() => setLoaded(true)}
            className={cn(
              "object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            draggable={false}
            unoptimized
          />
        )}
      </div>
    </AspectRatio>
  );
}
