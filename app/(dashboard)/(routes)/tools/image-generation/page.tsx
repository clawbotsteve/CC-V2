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
import { OutOfFreeCreditsModal } from "@/components/out-of-free-credits-modal";
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

  const { userId, refetch, isLoading, creditCosts, plan, availableCredit } = useUserContext();
  const [trainedModels, setTrainedModels] = useState<InfluencerWithOwner[]>([]);
  const [generations, setGenerations] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [authWallOpen, setAuthWallOpen] = useState(false);
  const [outOfFreeCreditsOpen, setOutOfFreeCreditsOpen] = useState(false);

  const uploadRefs = {
    image_url: useRef<ImageUploadHandle>(null),
  };

  const [form, setForm] = useState<ImageGenerationInput>(defaultImageGenerationForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const appliedQueryRef = useRef<string | null>(null);

  // Mirror the server-side getImageCreditVariant() so the Generate button
  // shows the actual credit cost the API will charge. If these drift, the
  // user sees one number on the button and gets billed another. The /api/tools/image
  // route is the source of truth — keep these in sync if you change either.
  const selectedCreditVariant =
    form.model === ImageGenerationModel.GptImage2
      ? `gpt_image_2_${form.quality ?? "medium"}`
      : form.model === ImageGenerationModel.NanoBanana2 ||
        form.model === ImageGenerationModel.NanoBannaPro ||
        form.model === ImageGenerationModel.NanoBanana2Base
        ? `nano_banana_2_${form.output_resolution ?? "1k"}`
        : form.enable_safety_checker
          ? "sfw"
          : "nsfw";

  const handleGenerate = async () => {
    if (!userId) {
      setAuthWallOpen(true);
      return;
    }

    const isFreePlan = plan === "plan_free" || plan === "free";
    if (isFreePlan && (availableCredit ?? 0) <= 0) {
      setOutOfFreeCreditsOpen(true);
      return;
    }

    setIsGenerating(true);

    const newGen = await createGeneration({
      options: form,
      setOptions: setForm,
      defaultOptions: { ...defaultImageGenerationForm, model: form.model },
      userId,
      apiEndpoint: endpoint,
      buildPayload: createImageJob,
      uploadRefs,
      callbacks: {
        refetch: fetchImages,
        onInsufficientCredits: () => {
          const isFreePlan = plan === "plan_free" || plan === "free";
          if (isFreePlan) setOutOfFreeCreditsOpen(true);
        },
      },
      // Preserve form settings the user actively chose so they don't have
      // to reselect them every generation. Without this, switching a user
      // who picked 4K and a 9:16 aspect would reset back to 1K + the
      // default aspect on the next click — which is what they reported.
      // Seed and uploaded reference image are deliberately NOT preserved
      // (seed must change to give a new generation; refs are handled by
      // the upload component's own reset).
      preserveFields: [
        "model",
        "aspect_ratio",
        "image_size",
        "output_format",
        "output_resolution", // Nano Banana 2 (1k / 2k / 4k)
        "quality",           // GPT Image 2 (low / medium / high)
        "soul_resolution",   // Soul 2.0 (720p / 1080p)
        "lora_id",
        "prompt",            // most users iterate on the same prompt
      ],
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
        creditVariant: selectedCreditVariant,
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
    const querySignature = `${modelParam ?? ""}|${promptParam ?? ""}`;

    // Apply query params once per unique query string to avoid resetting user-selected model on rerenders.
    if (appliedQueryRef.current === querySignature) return;

    const modelMap: Record<string, ImageGenerationModel> = {
      "gpt-image-2": ImageGenerationModel.GptImage2,
      "nano-banana-2": ImageGenerationModel.NanoBanana2Base,
      "nano-banana-2-edit": ImageGenerationModel.NanoBanana2,
      "flux-lora": ImageGenerationModel.Lora,
      // Deprecated picker entries 2026-04-29 — still resolve so old links work,
      // but the dispatch in /api/tools/image will gate them per plan.
      "nano-banana-pro": ImageGenerationModel.NanoBannaPro,
      "flux-v1": ImageGenerationModel.V1,
    };

    const selectedModel = modelParam ? modelMap[modelParam] : undefined;
    if (!selectedModel && !promptParam) return;

    appliedQueryRef.current = querySignature;

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
      {/*
        Page-chrome trim (2026-05-20 pass 2): the prior trim got the
        settings panel itself tight, but the OUTER chrome (huge top
        padding, oversized heading band, narrow 340px column, fat
        horizontal page padding) left a sea of unused dark space. This
        pass pulls the heading up closer to the nav, widens the
        settings column 340→380px (more breathing room inside the
        card the user explicitly asked for), stretches the sticky
        card vertically so it fills more of the viewport, and trims
        the outer page padding so the layout reaches closer to the
        viewport edges on wide screens.
      */}
      <div className="w-full px-4 md:px-6 pt-1 md:pt-2 pb-4 md:pb-6">
        <div className="py-1 md:sticky top-0 z-[9] bg-background flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between border-b border-foreground/40">
          <div className="flex gap-6">
            <AiAnimatedHeading
              compact
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

        </div>

        <div className="w-full pt-3">
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
            {/*
              Form panel layout: pin to viewport with internal scroll so the
              Generate button is ALWAYS visible without page-scroll. Settings
              area scrolls inside the card; the action bar at the bottom is
              non-shrinking. On mobile (no `xl:` breakpoint), the panel keeps
              its natural height so the page scrolls normally. The sticky
              card uses top-20 + max-h calc(100vh-5rem) so it pins right
              under the (now slimmer) heading band and stretches down for
              the full visible viewport — "full length" per the user's note.
            */}
            <aside className="rounded-2xl border border-border bg-card/60 flex flex-col xl:sticky xl:top-20 xl:max-h-[calc(100vh-5rem)]">
              <div className="px-5 pt-5 pb-1 flex-1 overflow-y-auto">
                <ImageSettingsPanel form={form} setForm={setForm} trainedModels={trainedModels} imageUploadRef={uploadRefs} />
              </div>

              <div className="px-5 pb-4 pt-3 border-t border-border bg-card/60 backdrop-blur-sm">
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

      <OutOfFreeCreditsModal
        open={outOfFreeCreditsOpen}
        onOpenChange={setOutOfFreeCreditsOpen}
      />
    </PageContainer>
  );
}
