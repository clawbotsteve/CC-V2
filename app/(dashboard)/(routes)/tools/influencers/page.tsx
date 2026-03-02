// ==============================================
// 🤖 Influencer Training Orchestration (Server)
// ==============================================

/**
 * STEP 1: User creates a new Influencer (internal API route)
 * - POST /api/influencers
 * - Payload includes:
 *    - userId
 *    - avatarImage (URL)
 *    - training ZIP file (URL or uploaded)
 * - This route orchestrates the full training process.
 */

/**
 * STEP 2: Submit a LoRA training job to FAL
 * - POST /api/train
 * - This queues the training job: fal/train-lora
 * - Input: { image_zip_url, trigger_word, etc. }
 * - Response: trainingJob.id (request_id)
 */

/**
 * STEP 3: Save Influencer in your DB
 * - Store influencer with:
 *    - userId, avatarImage, name, etc.
 *    - LoRA job ID
 *    - status = "queued"
 */

/**
 * STEP 4: Wait for LoRA training completion via webhook
 * - Webhook endpoint: /api/webhook/train
 * - FAL sends completion signal when training is done.
 * - Inside this webhook:
 *    ✅ Update influencer:
 *       - status = "trained"
 *       - loraUrl / configUrl (if available)
 *
 *    ✅ Then continue with next steps:
 *
 *    STEP 5: Generate a prompt from the avatar image
 *    - Use FAL’s non-queued model: fal/describe-avatar
 *    - Input: { image_url }
 *    - Output: prompt (e.g. “Futuristic confident digital creator…”)
 *
 *    STEP 6: Submit LoRA video generation request to FAL
 *    - Use fal/lora-video (queued)
 *    - Input:
 *        - lora_model_id (from step 2)
 *        - prompt (from step 5)
 *        - avatar_url (image)
 *    - Attach webhook to receive result later
 *
 *    STEP 7: Save video job to DB
 *    - Store jobId, prompt, status = "queued", influencerId, etc.
 */

/**
 * STEP 8: FAL Webhook (on /api/webhook/fal-video) is triggered
 * - When video completes or fails, FAL calls your webhook
 * - Validate FAL signature
 * - Update video job record with:
 *    - status, video URL, generation time, etc.
 */

/**
 * STEP 9: Mark Influencer’s training as completed
 * - Update influencer.status = "completed"
 * - Now usable by the user
 */

// ==============================================
// ✅ Optional: Notify user via email or in-app
// ✅ Optional: Charge credits for training + video
// ==============================================

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import InfluencerCreateDialog from "./_components/InfluencerCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Store } from "lucide-react";
import { useUserContext } from "@/components/layout/user-context";
import { Influencer } from "@prisma/client";
import InfluencerLoading from "./_components/InfluencerLoading";
import InfluencerCard from "./_components/InfluencerCard";
import EmptyState from "./_components/InfluencerEmpty";
import PageContainer from "@/components/page-container";
import { toast } from "sonner";
import { InfluencerWithLora, LoraFormDialog, LoraSubmitData } from "./_components/LoraFormDialog";
import Link from "next/link";
import { useProModal } from "@/hooks/use-pro-modal";
import { PLAN_STUDIO } from "@/constants";
import { InfluencerModel } from "@/types/influencer";
// import { useOnboardingStore } from "@/hooks/use-onboarding-store";
// import { STATUS } from "react-joyride";

/**
 * //* for onboarding
 * //* when 'create new influenccer' clicked, pause tour
 * //* when influencer queued, resume tour
 * //* when influencer form quit, resume tour
 *
 */

export default function InfluencersPage() {
  const { userId, isAdmin, maxAvatar, avatarCreated, isLoading: isContextLoading, refetch, plan } = useUserContext();
  const proModal = useProModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // const {
  //   currentStepIndex,
  //   context,
  //   pauseTour,
  //   resumeTour,
  //   status,
  //   setStepIndex,
  //   updateContext,
  // } = useOnboardingStore()

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialCreateModel, setInitialCreateModel] = useState<InfluencerModel | undefined>(undefined);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerWithLora | null>(null);

  // Polling refs
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchInfluencers = useCallback(async () => {
    if (!userId) return;

    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/influencers");
      if (!res.ok) throw new Error("Failed to fetch influencers");
      const influencers = await res.json();

      setInfluencers(influencers || []);

      // Start polling for queued/pending
      influencers.forEach((inf: Influencer) => {
        if (inf.status === "queued" || inf.status === "processing") {
          pollInfluencerStatus(inf.id);
        }
      });
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  const pollInfluencerStatus = (influencerId: string) => {
    if (pollingRefs.current[influencerId]) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/influencers/status/${influencerId}`);
        if (!res.ok) throw new Error("Failed to fetch influencer status");

        const data = await res.json();

        if (["completed", "failed"].includes(data.status)) {
          clearInterval(pollingRefs.current[influencerId]);
          delete pollingRefs.current[influencerId];
          refetch?.();
        }

        setInfluencers((prev) =>
          prev.map((inf) =>
            inf.id === influencerId ? { ...inf, status: data.status } : inf
          )
        );
      } catch (err) {
        console.error("Polling error for influencer", influencerId, err);
      }
    }, 5000);

    pollingRefs.current[influencerId] = interval;
  };

  const handleDelete = async (id: string) => {
    const deletingToast = toast.loading("Deleting influencer...");

    try {
      const res = await fetch(`/api/influencers/${id}`, {
        method: "DELETE",
      });

      toast.dismiss(deletingToast);

      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.error || "Failed to delete influencer");
        return;
      }

      toast.success("Influencer deleted!");

      // Optimistically remove from local state (if applicable)
      setInfluencers((prev) => prev.filter((inf) => inf.id !== id));
    } catch (err: any) {
      toast.dismiss(deletingToast);
      toast.error(err?.message || "Unexpected error during deletion");
    }
  };

  useEffect(() => {
    fetchInfluencers();
    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
      pollingRefs.current = {};
    };
  }, [fetchInfluencers]);

  useEffect(() => {
    const modelParam = searchParams.get("model");
    if (!modelParam) return;

    const modelMap: Record<string, InfluencerModel> = {
      "lora-training": InfluencerModel.FLUX_2,
      "avatar-to-video": InfluencerModel.FLUX_1,
    };

    const selected = modelMap[modelParam];
    if (selected) {
      setInitialCreateModel(selected);
      setIsDialogOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const onCreateSuccess = (influencer: Influencer, jobId: string) => {
    setInfluencers((prev) => [influencer, ...prev]);
    pollInfluencerStatus(jobId);

    // if (context.loraTrainingOpen && status === STATUS.PAUSED) {
    //   updateContext({ loraTrainingOpen: undefined })

    //   setStepIndex(currentStepIndex + 1)
    //   resumeTour()
    // }

    setIsDialogOpen(false)
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchInfluencers();
  };

  const handleLoraSubmit = async (values: LoraSubmitData) => {
    try {
      const res = await fetch("/api/lora/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to create LoRA.");
      }

      const lora = await res.json();
      toast.success("LoRA created successfully!"); // Optional
      // console.log("Created LoRA:", lora);

      fetchInfluencers()

      setIsManageDialogOpen(false);
      setSelectedInfluencer(null);
    } catch (error: any) {
      console.error("LoRA creation error:", error);
      toast.error(error.message || "Something went wrong.");
    }
  };

  const canCreateAvatar = (maxAvatar: number, avatarCreated: number): boolean => {
    if (maxAvatar === 0) return false;
    if (maxAvatar === Infinity) return true;

    return avatarCreated < maxAvatar;
  }

  const handleCreateInfluencer = () => {
    try {
      if (!plan) {
        throw new Error("Plan data unavailable.");
      }

      if (
        typeof maxAvatar === "number" &&
        maxAvatar > (avatarCreated as number) &&
        plan !== PLAN_STUDIO
      ) {
        setIsDialogOpen(true);
      } else {
        proModal.onOpen();
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    }
  };

  return (
    <PageContainer scrollable>
      <div className="p-4 sm:p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI Influencer</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Create and manage your influencers</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
          <aside className="rounded-2xl border border-border bg-card/60 p-4 h-fit xl:sticky xl:top-24">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Character Studio</h3>
            <Button onClick={handleCreateInfluencer} className="w-full mb-3">Create Influencer</Button>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} size="sm" className="flex-1">
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/dashboard/lora-market">
                  <Store className="h-4 w-4 mr-2" />
                  Market
                </Link>
              </Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Plan</span><span className="font-medium text-foreground">{plan || "-"}</span></div>
              <div className="flex items-center justify-between"><span>Avatars used</span><span className="font-medium text-foreground">{avatarCreated || 0}</span></div>
              <div className="flex items-center justify-between"><span>Max avatars</span><span className="font-medium text-foreground">{typeof maxAvatar === "number" ? maxAvatar : "∞"}</span></div>
            </div>
          </aside>

          <div>
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <InfluencerLoading />
        ) : influencers.length === 0 ? (
          <EmptyState onCreateClick={handleCreateInfluencer} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
            {influencers.map((inf) => (
              <InfluencerCard
                key={inf.id}
                influencer={inf}
                isAdmin={isAdmin as boolean}
                onDelete={handleDelete}
                onLoraSubmit={handleLoraSubmit}
                onManageLoraClick={() => {
                  setSelectedInfluencer(inf);
                  setIsManageDialogOpen(true);
                }}
              />
            ))}

            {isAdmin && selectedInfluencer && (
              <LoraFormDialog
                loraData={selectedInfluencer}
                isOpen={isManageDialogOpen}
                onOpenChange={(open) => {
                  setIsManageDialogOpen(open);
                  if (!open) setSelectedInfluencer(null); // clear when closed
                }}
                onSubmit={(values) => {
                  handleLoraSubmit(values);
                }}
              />
            )}

          </div>
        )}

        <InfluencerCreateDialog
          open={isDialogOpen}
          initialModel={initialCreateModel}
          onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen)
            if (!isOpen) setInitialCreateModel(undefined)

            // setStepIndex(currentStepIndex)
            // resumeTour()
          }}
          onCreateSuccess={onCreateSuccess}
        />
        {/* //TODO: not to run when on success */}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
