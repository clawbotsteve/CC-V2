"use client";

import { ReactNode, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { getActionButtonState } from "@/lib/get-action-button-state";
import { cn } from "@/lib/utils";
import { ToolType } from "@prisma/client";
import { ActionButtons } from "./generate-button";
import { useCreditWarningModal } from "@/hooks/use-credit-warning";

type CreditCostMap = {
  [tool in ToolType]?: {
    [variant: string]: number;
  };
};

interface GenerationSheetProps {
  triggerLabel?: string;
  headerTitle?: string;
  children: ReactNode;
  triggerClassName?: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  plan: any;
  availableCredit: number;
  toolType: ToolType;
  variant?: string;
  creditCosts: CreditCostMap;
  isLoading?: boolean;
  isGenerating?: boolean;
  disabled?: boolean;
  handleGenerate: () => void;
  generateLabel?: string;
  colorVariant?: string;
}

export function GenerationSettings({
  triggerLabel = "Generate Image",
  headerTitle = "Image Generation Settings",
  children,
  triggerClassName,
  open,
  onOpenChange,
  plan,
  availableCredit,
  toolType,
  variant = "default",
  creditCosts,
  isLoading = false,
  isGenerating = false,
  disabled = false,
  handleGenerate,
  generateLabel = "Generate",
  colorVariant = "pink",
}: GenerationSheetProps) {

  const { onOpen, requiredCredit, availableCredit: totalCredit } = useCreditWarningModal();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    setLoading(false);

    const buttonState = getActionButtonState({
      currentPlan: plan,
      availableCredit,
      toolType,
      variant,
      creditCosts,
    });

    switch (buttonState.action) {
      case "upgrade": {
        onOpen?.("free");
        break;
      }

      case "get_credit": {
        onOpen?.(
          "no-credit",
          buttonState.cost,
          availableCredit
        );
        break;
      }

      case "normal": {
        onOpenChange?.(true);
        break;
      }

      default:
        break;
    }
  };

  return (
    <div>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <Button
          variant="default"
          className={cn(
            "w-full flex items-center justify-center gap-2 transition-all duration-200",
            triggerClassName
          )}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {triggerLabel}
            </>
          )}
        </Button>

        <SheetContent className="overflow-y-auto scrollbar-thin w-full md:w-3/4 p-0">
          <SheetHeader className="text-left px-4 py-2 bg-background shadow-sm">
            <SheetTitle>{headerTitle}</SheetTitle>
          </SheetHeader>

          <div className="p-6">{children}</div>

          <SheetFooter className="p-6 sm:justify-start">
            <ActionButtons
              handleGenerate={handleGenerate}
              isLoading={isLoading}
              isGenerating={isGenerating}
              creditCosts={creditCosts!}
              toolType={toolType}
              variant={variant}
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
