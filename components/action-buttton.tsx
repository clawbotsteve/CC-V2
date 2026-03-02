"use client";

import { Button } from "@/components/ui/button";
import { Plus, ImageIcon, VideoIcon, Type } from "lucide-react";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useRouter } from "next/navigation";

interface ActionButtonProps {
  imageUrl?: string;
}

export function ActionButton({ imageUrl }: ActionButtonProps) {
  const router = useRouter();

  const handleGeneratePrompt = () => {
    if (imageUrl) {
      router.push(`/tools/prompt-generation?imageUrl=${encodeURIComponent(imageUrl)}`);
    }
  };

  const handleUpscale = () => {
    if (imageUrl) {
      router.push(`/tools/image-upscale?imageUrl=${encodeURIComponent(imageUrl)}`);
    }
  };

  const handleGenerateVideo = () => {
    if (imageUrl) {
      router.push(`/tools/video-generation?imageUrl=${encodeURIComponent(imageUrl)}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full p-0 w-8 h-8 bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10 transition">
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleUpscale}
          >
            <ImageIcon className="h-4 w-4" />
            Upscale
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleGenerateVideo}
          >
            <VideoIcon className="h-4 w-4" />
            Generate Video
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleGeneratePrompt}
          >
            <Type className="h-4 w-4" />
            Generate Prompt
          </Button>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
