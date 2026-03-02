"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type OptimizePromptButtonProps = {
  prompt: string;
  imageUrl?: string;
  imageUploadRef?: React.RefObject<any>;
  onOptimized: (optimizedPrompt: string) => void;
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
};

export function OptimizePromptButton({
  prompt,
  onOptimized,
  size = "sm",
  className,
}: OptimizePromptButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleOptimize = async () => {
    if (!prompt?.trim()) return;

    try {
      setIsLoading(true);
      // Keep behavior safe/minimal: preserve prompt if optimizer service is unavailable.
      onOptimized(prompt.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      className={className}
      disabled={isLoading || !prompt?.trim()}
      onClick={handleOptimize}
    >
      <Wand2 className="mr-2 h-4 w-4" />
      Optimize Prompt ✨1
    </Button>
  );
}

export default OptimizePromptButton;
