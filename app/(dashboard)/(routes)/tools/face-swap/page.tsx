"use client";

import React, { useEffect, useRef, useState } from "react";
import { WandSparkles, } from "lucide-react";
import PageContainer from "@/components/page-container";
import { useUserContext } from "@/components/layout/user-context";
import { FaceSwap, GenerationStatus, ToolType } from "@prisma/client";
import { FaceSwapHistory } from "./_components/FaceSwapHistory";
import { useCreditWarningModal } from "@/hooks/use-credit-warning";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { HowToUseDrawer } from "@/components/how-to-use-drawer";
import { GenerationSettings } from "@/components/generation-settings";
import { CreditCostDisplay } from "@/components/credit-costs-display";
import Settings from "./_components/Settings";
import { defaultFaceSwapForm, FaceSwapForm } from "@/types/swap";
import { fetchGenerations } from "@/lib/fetch-generation";
import { pollGenerationStatus } from "@/lib/poll-generation-status";
import { createGeneration } from "@/lib/create-generation";
import { ImageUploadHandle } from "@/components/image-upload";


export default function FaceSwapPage() {
  const endpoint = "/api/tools/face-swap"
  const { onOpen } = useCreditWarningModal();

  const { userId, refetch, plan, availableCredit, isLoading, dailyUsage, creditCosts } = useUserContext();
  const [generations, setGenerations] = useState<FaceSwap[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const uploadRefs = {
    face_image0: useRef<ImageUploadHandle>(null),
    face_image1: useRef<ImageUploadHandle>(null),
    target_image: useRef<ImageUploadHandle>(null),
  };

  const [form, setForm] = useState<FaceSwapForm>(defaultFaceSwapForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const handleGenerate = async () => {
    const newGen = await createGeneration({
      options: form,
      setOptions: setForm,
      defaultOptions: defaultFaceSwapForm,
      userId: userId!,
      apiEndpoint: endpoint,
      buildPayload: (options) => options,
      uploadRefs: uploadRefs,
      callbacks: {
        closeSettings: () => setIsSettingsOpen(false),
        refetch: fetchImages
      }
    });

    if (newGen) {
      const generatedImage: FaceSwap = {
        id: newGen.id,
        userId: newGen.userId,
        firstFace: form.face_image0,
        firstUserGender: form.gender0,
        secondFace: form.face_image1 ?? "",
        secondUserGender: form.gender1 ?? "",
        swapedUrl: "",
        targetImage: form.target_image,
        workflowType: form.workflow_type,
        upscale2x: form.upscale ?? false,
        enableDetailer: form.detailer ?? false,
        nsfwFlag: false,
        generationTime: new Date(),
        reason: {},
        status: newGen.status as GenerationStatus,
        creditUsed: (typeof creditCosts?.[ToolType.IMAGE_EDITOR] === 'number'
          ? creditCosts[ToolType.IMAGE_EDITOR] as number
          : (creditCosts?.[ToolType.IMAGE_EDITOR] as Record<string, number>)?.["face_swap"]
        ) ?? 4,
        createdAt: newGen.createdAt,
        updatedAt: newGen.updatedAt,
      };

      setGenerations((prev) => [generatedImage, ...prev]);
      pollGenerationStatus({
        generationId: newGen.id,
        apiEndpoint: endpoint,
        setItems: setGenerations,
        pollingRefs: pollingRefs,
        refetch: fetchImages,
      });

    }
  };

  const fetchImages = async (): Promise<void> => {
    await fetchGenerations({
      apiEndpoint: endpoint,
      setItems: setGenerations,
      pollingRefs: pollingRefs,
      refetch: fetchImages,
      setIsLoading: setIsLoadingImages,
    });
  };

  useEffect(() => {
    fetchImages();

    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  return (
    <PageContainer>
      <div className="w-full p-4 md:p-8">
        {/* header */}
        <div className="py-4 md:sticky top-0 z-[9] bg-background flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between border-b border-foreground/40">
          <div className="flex gap-6">
            <AiAnimatedHeading
              heading="Faceswap"
              description="Create and manage your face swap transformations"
              icon={<WandSparkles className="h-6 w-6" />}
            >
              <CreditCostDisplay
                creditCosts={creditCosts}
                toolType={ToolType.IMAGE_EDITOR}
              />
            </AiAnimatedHeading>

            <HowToUseDrawer
              headerTitle="🔄 Quick Guide: AI Face Swap"
              headerDescription="Swap faces between two images easily."
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Upload Source Image:</strong> Choose the image with the face you want to use.</p>
                <p><strong>Upload Target Image:</strong> Select the photo where the face will be swapped.</p>
                <p><strong>Adjust Face Alignment:</strong> Ensure both faces are detected and aligned properly.</p>
                <p><strong>Apply Swap:</strong> Click “Swap Faces” to process the image.</p>
                <p><strong>Preview & Download:</strong> Review the result and save it if you’re happy.</p>
                <p className="text-xs italic text-muted-foreground">
                  Tip: Use clear, front-facing photos for the best results.
                </p>
              </div>
            </HowToUseDrawer>
          </div>

          <GenerationSettings
            triggerLabel="Swap Face"
            headerTitle="Face Swap Settings"
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            plan={plan!}
            availableCredit={availableCredit!}
            creditCosts={creditCosts!}
            toolType={ToolType.IMAGE_EDITOR}
            handleGenerate={handleGenerate}
          >
            <Settings
              form={form}
              setForm={setForm}
              imageUploadRef={uploadRefs}
            />
          </GenerationSettings>
        </div>

        {/* content */}
        <div className="w-full pt-12">
          <FaceSwapHistory
            images={generations}
            isLoading={isLoadingImages}
            onDelete={fetchImages}
            pollingRefs={pollingRefs}
          />
        </div>
      </div>
    </PageContainer>
  );
}
