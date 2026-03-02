"use client";

import { useState, useEffect, useRef } from "react";
import { Brush, } from "lucide-react";
import PageContainer from "@/components/page-container";
import { useUserContext } from "@/components/layout/user-context";
import { FaceEnhance, GenerationStatus, SafetyLevel, ToolType } from "@prisma/client";
import { ImageHistory } from "./_components/ImageHistory";
import { useCreditWarningModal } from "@/hooks/use-credit-warning";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { HowToUseDrawer } from "@/components/how-to-use-drawer";
import { GenerationSettings } from "@/components/generation-settings";
import { CreditCostDisplay } from "@/components/credit-costs-display";
import { fetchGenerations } from "@/lib/fetch-generation";
import { pollGenerationStatus } from "@/lib/poll-generation-status";
import { createGeneration } from "@/lib/create-generation";
import { defaultFaceEnhanceForm, FaceEnhanceForm } from "@/types/enhance";
import Settings from "./_components/Settings";
import { ImageUploadHandle } from "@/components/image-upload";

export default function ImageEditPage() {
  const endpoint = "/api/tools/face-enhance"
  const { onOpen } = useCreditWarningModal();

  const { userId, refetch, plan, availableCredit, isLoading, dailyUsage, creditCosts } = useUserContext();
  const [generations, setGenerations] = useState<FaceEnhance[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const uploadRefs = {
    image: useRef<ImageUploadHandle>(null)
  }
  const [form, setForm] = useState<FaceEnhanceForm>(defaultFaceEnhanceForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const handleGenerate = async () => {
    const newGen = await createGeneration({
      options: form,
      setOptions: setForm,
      defaultOptions: defaultFaceEnhanceForm,
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
      const generatedImage: FaceEnhance = {
        id: newGen.id,
        userId: newGen.userId,
        originalUrl: newGen.image!,
        editedUrl: "",
        aspectRatio: "landscape_16_9",
        guidanceScale: newGen.guidance_scale,
        inferenceStep: newGen.num_inference_step,
        outputFormat: newGen.output_format,
        safetyLevel: newGen.safety_level as unknown as SafetyLevel,
        nsfwFlag: false,
        generationTime: new Date(),
        reason: {},
        status: newGen.status as GenerationStatus,
        creditUsed: (typeof creditCosts?.[ToolType.FACE_ENHANCE] === 'number'
          ? creditCosts[ToolType.FACE_ENHANCE] as number
          : 2
        ) ?? 2,
        createdAt: new Date(),
        updatedAt: new Date(),
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
              heading="Face Enhancement"
              description="Make every face stand out — smooth, sharpen, and enhance with one click."
              icon={<Brush className="h-6 w-6" />}
            >
              <CreditCostDisplay
                creditCosts={creditCosts}
                toolType={ToolType.FACE_ENHANCE}
              />
            </AiAnimatedHeading>

            <HowToUseDrawer
              headerTitle="✨ Quick Guide: AI Face Enhancement"
              headerDescription="Enhance and refine facial details with these steps."
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Upload Image:</strong> Select the photo you want to enhance.</p>
                <p><strong>Choose Enhancement Level:</strong> Pick from subtle, medium, or high detail improvement.</p>
                <p><strong>Enable Options (Optional):</strong> Smooth skin, adjust lighting, or enhance sharpness.</p>
                <p><strong>Preview Changes:</strong> Check how your image looks before applying.</p>
                <p><strong>Apply & Download:</strong> Click “Enhance” and download your improved photo.</p>
                <p className="text-xs italic text-muted-foreground">
                  Tip: Use high-resolution images for the best results.
                </p>
              </div>
            </HowToUseDrawer>

          </div>


          <GenerationSettings
            triggerLabel="Enhance Face"
            headerTitle="Face Enhancement Settings"
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            plan={plan!}
            availableCredit={availableCredit!}
            creditCosts={creditCosts!}
            toolType={ToolType.FACE_ENHANCE}
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
          <ImageHistory
            images={generations}
            isLoading={isLoadingImages}
            onDelete={fetchImages}
            pollingRefs={pollingRefs}
          />
        </div>
      </div>
    </PageContainer >
  );
}
