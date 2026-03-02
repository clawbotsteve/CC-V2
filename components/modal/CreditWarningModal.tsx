"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreditWarningModal } from "@/hooks/use-credit-warning";
import { Rocket, Zap, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useProModal } from "@/hooks/use-pro-modal";
import { useState } from "react";

export function CreditWarningModal() {
  const { isOpen, reason, requiredCredit, availableCredit, onClose } = useCreditWarningModal();
  const proModal = useProModal();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const isFreePlan = reason === "free";

  const handleClick = () => {
    setIsLoading(true);

    // Small delay for better UX (button feedback)
    setTimeout(() => {
      onClose();

      if (isFreePlan) {
        proModal.onOpen();
        setIsLoading(false); // Stop loading since we're not navigating away
      } else {
        router.push("/dashboard/get-credits");
        // No need to reset loading because navigation will happen
      }
    }, 400);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            "bg-primary p-6 text-primary-foreground"
          )}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              {isFreePlan ? (
                <Rocket className="h-8 w-8" strokeWidth={1.5} />
              ) : (
                <Zap className="h-8 w-8" strokeWidth={1.5} />
              )}
              <DialogTitle className="text-primary-foreground">
                {isFreePlan ? "Unlock Premium Features" : "More Credits Needed"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <DialogDescription className="text-primary-foreground/90">
            {isFreePlan ? (
              <span className="mt-2">
                This premium feature requires an upgraded plan. Get full access to all capabilities!
              </span>
            ) : (
              <span className="mt-2">
                You need additional credits to proceed. Upgrade or buy more to continue.
              </span>
            )}
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info Card */}
          <div className="p-4 bg-muted/50 rounded-lg border border-muted-foreground/20">
            <div className="flex items-center gap-4 mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-medium">
                  {isFreePlan ? "Choose your plan" : "Credit details"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isFreePlan
                    ? "Plans start at just $29/month"
                    : "Review your credit balance below"}
                </p>
              </div>
            </div>

            {!isFreePlan && (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                  <p className="text-xs text-muted-foreground">Required</p>
                  <p className="text-lg font-semibold text-primary">{requiredCredit ?? 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-lg font-semibold">{availableCredit ?? 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="hover:bg-muted/50"
              disabled={isLoading}
            >
              Maybe later
            </Button>
            <Button
              variant="default"
              onClick={handleClick}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFreePlan ? (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Upgrade Now
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Buy Credits
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
