"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { useUserContext } from "../../../../../../components/layout/user-context";
import { PLAN_STUDIO } from "@/constants";

interface InfluencerCreateTriggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InfluencerCreateTrigger({
  open,
  onOpenChange,
}: InfluencerCreateTriggerProps) {
  const [isChecking, setIsChecking] = React.useState(false);

  const proModal = useProModal();
  const { plan, maxAvatar, avatarCreated } = useUserContext();

  const handleClick = () => {
    setIsChecking(true);

    try {
      if (!plan) {
        throw new Error("Plan data unavailable.");
      }

      if (
        typeof maxAvatar === "number" &&
        maxAvatar > (avatarCreated as number) &&
        plan !== PLAN_STUDIO
      ) {
        onOpenChange(true);
      } else {
        proModal.onOpen();
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        onClick={handleClick}
        disabled={isChecking}
        className="gap-2"
      >
        {isChecking ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Create New Influencer
          </>
        )}
      </Button>
    </>
  );
}
