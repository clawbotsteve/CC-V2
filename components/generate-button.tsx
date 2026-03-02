"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";
import { ToolType } from "@prisma/client";
import { CreditCost } from "./credit-cost";

type CreditCostMap = {
  [tool in ToolType]?: {
    [variant: string]: number;
  };
};

type ActionButtonsProps = {
  handleGenerate: () => void;
  isLoading?: boolean;
  isGenerating?: boolean;
  creditCosts: CreditCostMap;
  toolType: ToolType;
  variant?: string;
  generateLabel?: string;
  colorVariant?: "pink" | "blue" | "orange" | "gray" | "yellow";
  disabled?: boolean;
};

export function ActionButtons({
  handleGenerate,
  isLoading,
  isGenerating,
  creditCosts,
  toolType,
  variant = "default",
  generateLabel = "Generate",
  colorVariant = "pink",
  disabled,
}: ActionButtonsProps) {


  return (
    <div className="flex flex-col gap-2 items-start">
      <Button
        variant="default"
        className={cn(
          "h-[44px] px-4 gap-2 transition-all duration-300"
        )}
        disabled={isLoading || isGenerating || disabled}
        onClick={handleGenerate}
      >
        {(isLoading || isGenerating) ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isGenerating ? "Generating..." : "Loading"}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {generateLabel}
            <CreditCost creditCosts={creditCosts} toolType={toolType} variant={variant} />
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        AI can make mistakes, multiple attempts may be required
      </p>
    </div>

  );
}
