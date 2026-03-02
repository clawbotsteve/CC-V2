"use client";

import axios from "axios";
import { useState } from "react";
import { Zap, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useUserContext } from "./layout/user-context";
import { useProModal } from "@/hooks/use-pro-modal";
import { UserSubscriptionResponse } from "@/app/api/user/subscription/route";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PLAN_FREE } from "@/constants";

type LoadingButton = "cancel" | "manage" | "upgrade" | null;

export const SubscriptionButton = ({ subscription }: { subscription: UserSubscriptionResponse }) => {
  const router = useRouter();

  const [loadingButton, setLoadingButton] = useState<LoadingButton>(null);
  const { userId, plan, customerId, planId, isLoading } = useUserContext();
  const { user } = useUser()
  const proModal = useProModal();

  const updatePhyziro = async () => {
    try {
      setLoadingButton("upgrade");
      const response = await fetch('/api/billing/pz/subscriptions/update', {
        method: 'POST',
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          userId: userId,
          tier: plan
        }),
      })

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoadingButton(null);
    }
  };

  const cancelPhyziro = async (type: LoadingButton) => {
    if (plan === PLAN_FREE) {
      proModal.onOpen();
      return;
    } else {
      try {
        setLoadingButton(type);

        const response = await axios.post("/api/billing/pz/unsubscribe", {
          userId: userId,
          userSubscriptionId: customerId,
          subscriptionPlanId: planId,
        });

        const data = response.data;

        if (data?.success) {
          toast.success("Successfully unsubscribed.");
          console.log("Unsubscribed externalId:", data.externalId);
          console.log("New subscriptionPlanId:", data.subscriptionPlanId);
          setTimeout(() => { window.location.reload() }, 6000);
        } else {
          toast.error(data?.error || "Unsubscribe failed.");
        }

      } catch (error) {
        console.error("[UNSUBSCRIBE_ERROR]", error);
        toast.error("Failed to unsubscribe due to an error.");
      } finally {
        setLoadingButton(null);
      }
    }
  };

  const handleCancel = async () => {
    if (subscription.phyziroSubscriptionId) {
      // If Phyziro subscription exists, call the cancelPhyziro function
      await cancelPhyziro("cancel");
      router.refresh(); // Add refresh here to show updated status
    } else {
      // No subscription found to cancel
      toast.info(`No active subscription found to cancel. If you have a valid subscription but are unable to subscribe please contact Phyziro using phyziro@phyziro.com ${subscription.status}`);
    }
  };

  // Changed onClick from `handleCancel` to `cancelPhyziro` function
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {!isLoading && plan !== PLAN_FREE && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={loadingButton === "cancel" || loadingButton === "manage"}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto"
            >
              {loadingButton === "cancel" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Cancel Subscription?
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm sm:text-base">
                Are you sure you want to cancel your subscription?
                <span className="block mt-2 font-semibold text-red-600">
                  ⚠️ If you cancel, your monthly credits will expire immediately.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Keep Subscription
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  Yes, Cancel Subscription
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* {subscription?.phyziroCurrentPeriodEnd &&
        new Date(subscription.phyziroCurrentPeriodEnd).getTime() - Date.now() <= 24 * 60 * 60 * 1000 && (
          <Button
            onClick={updatePhyziro}
            disabled={loadingButton === "cancel" || loadingButton === "manage"}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto"
          >
            {loadingButton === "upgrade" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Update Subscription"
            )}
          </Button>
        )} */}

    </div>
  );

};
