"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import PageContainer from "@/components/page-container";
import { useUserContext } from "@/components/layout/user-context";
import { GenerationStatus, ImageAnalysis, ToolType } from "@prisma/client";
import { useCreditWarningModal } from "@/hooks/use-credit-warning";
import PromptGenerationSettings from "./_components/PromptGenerationSettings";
import { GeneratedPromptList } from "./_components/GeneratedPrompt";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { HowToUseDrawer } from "@/components/how-to-use-drawer";
import { GenerationSettings } from "@/components/generation-settings";
import { CreditCostDisplay } from "@/components/credit-costs-display";
import { defaultPromptGenerationForm, PromptGenerationInput } from "@/types/prompt";
import { fetchGenerations } from "@/lib/fetch-generation";
import { createGeneration } from "@/lib/create-generation";
import { pollGenerationStatus } from "@/lib/poll-generation-status";
import { ImageUploadHandle } from "@/components/image-upload";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function ImageAnalyzer() {
  const endpoint = "/api/tools/prompt"
  const { onOpen } = useCreditWarningModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { userId, refetch, plan, availableCredit, isLoading, dailyUsage, creditCosts } = useUserContext();
  const [generations, setGenerations] = useState<ImageAnalysis[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const uploadRefs = {
    image_url: useRef<ImageUploadHandle>(null)
  }
  const [form, setForm] = useState<PromptGenerationInput>(defaultPromptGenerationForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl');
    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl);
      setPendingImageUrl(decodedUrl);
      setIsSettingsOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams]);


  useEffect(() => {
    const loadImage = async () => {
      if (isSettingsOpen && pendingImageUrl && uploadRefs.image_url.current) {
        try {
          await uploadRefs.image_url.current?.setFilesFromUrls([pendingImageUrl]);
          setPendingImageUrl(null);
        } catch (error) {
          console.error("Failed to load image:", error);
          toast.error("Failed to load image");
          setPendingImageUrl(null);
        }
      }
    };

    // Small delay to ensure ref is properly initialized
    const timer = setTimeout(loadImage, 100);
    return () => clearTimeout(timer);
  }, [isSettingsOpen, pendingImageUrl]);

  const handleAnalysis = async () => {
    const newGen = await createGeneration({
      options: form,
      setOptions: setForm,
      defaultOptions: defaultPromptGenerationForm,
      userId: userId!,
      apiEndpoint: endpoint,
      buildPayload: (options) => options,
      uploadRefs: uploadRefs,
      callbacks: {
        closeSettings: () => setIsSettingsOpen(false),
        refetch: fetchAnalysis
      }
    });

    if (newGen) {
      const generatedImage: ImageAnalysis = {
        id: newGen.id,
        userId: newGen.userId,
        originalImage: newGen.image_url,
        description: "",
        prompt: newGen.input_concept,
        nsfwFlag: false,
        generationTime: new Date(),
        reason: {},
        creditUsed: (typeof creditCosts?.[ToolType.PROMPT_GENERATOR] === 'number'
          ? creditCosts[ToolType.PROMPT_GENERATOR] as number
          : 1
        ) ?? 1,
        status: newGen.status as GenerationStatus,
        createdAt: newGen.createdAt,
        updatedAt: newGen.updatedAt,
      };

      setGenerations((prev) => [generatedImage, ...prev]);
      pollGenerationStatus({
        generationId: newGen.id,
        apiEndpoint: endpoint,
        setItems: setGenerations,
        pollingRefs: pollingRefs,
        refetch: refetch,
        urlField: "description",
      });

    }
  };

  const fetchAnalysis = async (): Promise<void> => {
    await fetchGenerations({
      apiEndpoint: endpoint,
      setItems: setGenerations,
      pollingRefs: pollingRefs,
      refetch: fetchAnalysis,
      setIsLoading: setIsLoadingPrompts,
    });
  };



  const handleSettingsClose = (open: boolean) => {
    setIsSettingsOpen(open);
    if (!open) {
      setPendingImageUrl(null);
      setForm(defaultPromptGenerationForm);
      uploadRefs.image_url.current?.reset();
    }
  };

  useEffect(() => {
    fetchAnalysis();

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
              heading="Prompt Generation"
              description="Generate detailed descriptions and prompts for video from your images"
              icon={<MessageSquare className="h-6 w-6" />}
            >
              <CreditCostDisplay
                creditCosts={creditCosts}
                toolType={ToolType.PROMPT_GENERATOR}
              />
            </AiAnimatedHeading>

            <HowToUseDrawer
              headerTitle="💡 Quick Guide: AI Prompt Generator"
              headerDescription="Create better prompts for stunning AI results."
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Open Prompt Generator:</strong> Click “Generate Prompt”.</p>
                <p><strong>Choose Style:</strong> Select the tone, art style, or theme you want.</p>
                <p><strong>Add Keywords:</strong> Enter main subjects or concepts (e.g., “sunset, mountains, futuristic city”).</p>
                <p><strong>Customize Details:</strong> Pick mood, color palette, camera angle, or lighting.</p>
                <p><strong>Generate Prompt:</strong> Click “Generate” to create a detailed, optimized prompt.</p>
                <p><strong>Copy & Use:</strong> Copy the prompt and use it in your image or video generator.</p>
                <p className="text-xs italic text-muted-foreground">
                  Tip: The more specific your keywords and styles, the better your AI results.
                </p>
              </div>
            </HowToUseDrawer>
          </div>

          <GenerationSettings
            triggerLabel="Generate Prompt"
            headerTitle="Prompt Generation Settings"
            open={isSettingsOpen}
            onOpenChange={handleSettingsClose}
            plan={plan!}
            availableCredit={availableCredit!}
            creditCosts={creditCosts!}
            toolType={ToolType.PROMPT_GENERATOR}
            handleGenerate={handleAnalysis}
          >
            <PromptGenerationSettings
              form={form}
              setForm={setForm}
              imageUploadRef={uploadRefs} />
          </GenerationSettings>
        </div>

        {/* content */}
        <div className="w-full pt-12">
          <GeneratedPromptList
            isLoading={isLoadingPrompts}
            generatedPrompt={generations}
            onDelete={fetchAnalysis}
            pollingRefs={pollingRefs}
          />
        </div>
      </div>
    </PageContainer>
  );
}
