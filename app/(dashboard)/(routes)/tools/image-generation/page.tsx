"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/components/page-container";
import { useUserContext } from "@/components/layout/user-context";
import { GeneratedImage, GenerationStatus, ToolType } from "@prisma/client";
import { defaultImageGenerationForm, ImageGenerationInput, ImageGenerationModel } from "@/types/image";
import { InfluencerWithOwner } from "@/types/types";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { HowToUseDrawer } from "@/components/how-to-use-drawer";
import { CreditCostDisplay } from "@/components/credit-costs-display";
import { ActionButtons } from "@/components/generate-button";
import { Sparkles } from "lucide-react";
import { AuthWallModal } from "@/components/auth-wall-modal";
import { GeneratedImageList } from "./_components/GeneratedImageList";
import { ImageUploadHandle } from "@/components/image-upload";
import ImageSettingsPanel from "./_components/ImageSettingsPanel";
import { createGeneration } from "@/lib/create-generation";
import { pollGenerationStatus } from "@/lib/poll-generation-status";
import { fetchGenerations } from "@/lib/fetch-generation";
import { createImageJob } from "@/lib/validation/create-image-job";

export default function GenerateImagePage() {
  const endpoint = "/api/tools/image";
  const searchParams = useSearchParams();

  const { userId, refetch, isLoading, creditCosts } = useUserContext();
  const [trainedModels, setTrainedModels] = useState<InfluencerWithOwner[]>([]);
  const [generations, setGenerations] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [authWallOpen, setAuthWallOpen] = useState(false);

  const uploadRefs = {
    image_url: useRef<ImageUploadHandle>(null),
  };

  const [form, setForm] = useState<ImageGenerationInput>(defaultImageGenerationForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const selectedCreditVariant =
    form.model === ImageGenerationModel.NanoBanana2 || form.model === ImageGenerationModel.NanoBannaPro
      ? `nano_banana_2_${form.output_resolution ?? "1k"}`
      : form.enable_safety_checker
        ? "sfw"
        : "nsfw";

  const handleGenerate = async () => {
    if (!userId) {
      setAuthWallOpen(true);
      return;
    }

    setIsGenerating(true);

    const newGen = await createGeneration({
      options: form,
      setOptions: setForm,
      defaultOptions: defaultImageGenerationForm,
      userId,
      apiEndpoint: endpoint,
      buildPayload: createImageJob,
      uploadRefs,
      callbacks: {
        refetch: fetchImages,
      },
    });

    if (newGen) {
      const generatedImage: GeneratedImage = {
        id: newGen.id,
        userId: newGen.userId,
        status: newGen.status as GenerationStatus,
        createdAt: newGen.createdAt,
        updatedAt: newGen.updatedAt,
        creditUsed:
          (typeof creditCosts?.[ToolType.IMAGE_GENERATOR] === "number"
            ? (creditCosts[ToolType.IMAGE_GENERATOR] as number)
            : 1) ?? 1,
        imageUrl: "",
        images: {},
        prompt: newGen.prompt ?? "",
        aspectRatio: null,
        contentType: "sfw",
        nsfwFlag: false,
        variant: "sfw",
        generationTime: new Date(),
        reason: {},
      };

      setGenerations((prev) => [generatedImage, ...prev]);

      pollGenerationStatus({
        generationId: newGen.id,
        apiEndpoint: endpoint,
        setItems: setGenerations,
        pollingRefs,
        refetch,
      });
    }

    setIsGenerating(false);
  };

  const fetchImages = async (): Promise<void> => {
    await fetchGenerations({
      apiEndpoint: endpoint,
      setItems: setGenerations,
      pollingRefs,
      refetch: fetchImages,
      setIsLoading: setIsLoadingImages,
    });
  };

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/influencers");
      const raw = await res.json();
      const data: InfluencerWithOwner[] = Array.isArray(raw) ? raw : [];
      const readyModels = data.filter((m: any) => m?.status === "completed" && m?.loraUrl);
      setTrainedModels(readyModels);
    } catch (err) {
      console.error("Failed to fetch models", err);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchModels();

    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    const modelParam = searchParams.get("model");
    const promptParam = searchParams.get("prompt");

    const modelMap: Record<string, ImageGenerationModel> = {
      "nano-banana-pro": ImageGenerationModel.NanoBannaPro,
      "nano-banana-2": ImageGenerationModel.NanoBanana2Base,
      "nano-banana-2-edit": ImageGenerationModel.NanoBanana2,
      "flux-lora": ImageGenerationModel.Lora,
      "flux-v1": ImageGenerationModel.V1,
    };

    const selectedModel = modelParam ? modelMap[modelParam] : undefined;
    if (!selectedModel && !promptParam) return;

    setForm((prev) => ({
      ...prev,
      ...(selectedModel
        ? {
            model: selectedModel,
            ...(selectedModel === ImageGenerationModel.NanoBannaPro ? { aspect_ratio: undefined, lora_id: "none" } : {}),
            ...(selectedModel === ImageGenerationModel.Lora ||
            selectedModel === ImageGenerationModel.V1 ||
            selectedModel === ImageGenerationModel.Soul2 ||
            selectedModel === ImageGenerationModel.NanoBanana2
              ? { referenceImage: undefined, image_url: undefined }
              : {}),
          }
        : {}),
      ...(promptParam ? { prompt: promptParam } : {}),
    }));
  }, [searchParams]);

  return (
    <PageContainer>
      <div className="w-full p-4 md:p-8">
        <div className="py-4 md:sticky top-0 z-[9] bg-background flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between border-b border-foreground/40">
          <div className="flex gap-6">
            <AiAnimatedHeading
              heading="Image Generator"
              description="Create production-ready images in a few clicks"
              icon={<Sparkles className="h-6 w-6" />}
            >
              <CreditCostDisplay creditCosts={creditCosts} toolType={ToolType.IMAGE_GENERATOR} />
            </AiAnimatedHeading>

            <HowToUseDrawer
              headerTitle="Quick start: Image Generator"
              headerDescription="Simple flow: mode → model → prompt → generate."
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Pick a model, write a clear prompt, optionally upload references, and click Generate.</p>
                <p className="text-xs italic text-muted-foreground mt-2">Tip: Clear prompts produce cleaner output.</p>
              </div>
            </HowToUseDrawer>
          </div>

          <div className="hidden sm:block text-sm text-muted-foreground self-end">Configure on the left → generate on the left panel</div>
        </div>

        <div className="w-full pt-8">
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <aside className="rounded-2xl border border-border bg-card/60 p-4 h-fit xl:sticky xl:top-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Image Generation Settings</h3>

              <ImageSettingsPanel form={form} setForm={setForm} trainedModels={trainedModels} imageUploadRef={uploadRefs} />

              <div className="pt-4 border-t border-border mt-4">
                <ActionButtons
                  handleGenerate={handleGenerate}
                  isLoading={isLoading}
                  isGenerating={isGenerating}
                  creditCosts={creditCosts!}
                  toolType={ToolType.IMAGE_GENERATOR}
                  variant={selectedCreditVariant}
                />
              </div>
            </aside>

            <div>
              <GeneratedImageList images={generations} isLoading={isLoadingImages} onDelete={fetchImages} pollingRefs={pollingRefs} />
            </div>
          </div>
        </div>
      </div>

      <AuthWallModal
        open={authWallOpen}
        onOpenChange={setAuthWallOpen}
      />
    </PageContainer>
  );
}
