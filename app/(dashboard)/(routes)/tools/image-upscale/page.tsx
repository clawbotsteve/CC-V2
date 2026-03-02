"use client";

import { useState, useRef, useEffect } from "react";
import { Image, } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import PageContainer from "@/components/page-container";
import { useUserContext } from "@/components/layout/user-context";
import { GenerationStatus, ToolType, Upscaled } from "@prisma/client";
import UpscaleHistory from "./_components/UpscaleHistory";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { HowToUseDrawer } from "@/components/how-to-use-drawer";
import { CreditCostDisplay } from "@/components/credit-costs-display";
import { ActionButtons } from "@/components/generate-button";
import Settings from "./_components/Settings";
import { ClarityUpscalerInput, defaultClarityUpscalerForm, getUpscaleVariant, UpscaleModel } from "@/types/upscale";
import { fetchGenerations } from "@/lib/fetch-generation";
import { pollGenerationStatus } from "@/lib/poll-generation-status";
import { createGeneration } from "@/lib/create-generation";
import { ImageUploadHandle } from "@/components/image-upload";
import { VideoUploadHandle } from "@/components/video-upload";

export default function UpscalePage() {
  const endpoint = "/api/tools/upscale"

  const { userId, isLoading, creditCosts } = useUserContext();
  const [generations, setGenerations] = useState<Upscaled[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const uploadRefs = {
    image_url: useRef<ImageUploadHandle>(null),
    video_url: useRef<VideoUploadHandle>(null),
  }
  const [form, setForm] = useState<ClarityUpscalerInput>(defaultClarityUpscalerForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl');
    const modelParam = searchParams.get('model');

    if (modelParam === 'seedvr-image') {
      setForm((f) => ({ ...f, model: UpscaleModel.SeedVrImage }));
      router.replace(pathname, { scroll: false });
      return;
    }

    if (modelParam === 'bytedance-video') {
      setForm((f) => ({ ...f, model: UpscaleModel.BytedanceVideo }));
      router.replace(pathname, { scroll: false });
      return;
    }

    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl);
      setPendingImageUrl(decodedUrl);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams]);

  useEffect(() => {
    const loadImage = async () => {
      if (pendingImageUrl && uploadRefs.image_url.current) {
        try {
          await uploadRefs.image_url.current?.setFilesFromUrls([pendingImageUrl]);
          setPendingImageUrl(null);
        } catch (error) {
          console.error("Failed to load image:", error);
          setPendingImageUrl(null);
        }
      }
    };

    const timer = setTimeout(loadImage, 100);
    return () => clearTimeout(timer);
  }, [pendingImageUrl]);

  const handleGenerate = async () => {
    const newGen = await createGeneration({
      options: form,
      setOptions: setForm,
      defaultOptions: defaultClarityUpscalerForm,
      userId: userId!,
      apiEndpoint: endpoint,
      buildPayload: (options) => ({
        ...options,
        prompt: options.model === UpscaleModel.BytedanceVideo ? (options.prompt || "Video upscale") : options.prompt,
      }),
      uploadRefs: uploadRefs,
      callbacks: {
        refetch: fetchImages
      }
    });

    if (newGen) {
      const generatedImage: Upscaled = {
        id: newGen.id,
        userId: newGen.userId,
        originalImage: (newGen as any).video_url || newGen.image_url,
        upscaledImage: "",
        scale: newGen.upscale_factor || 2,
        steps: newGen.num_inference_steps!,
        dynamic: newGen.seed!,
        creativity: newGen.creativity!,
        resemblance: newGen.resemblance!,
        promptAdherence: newGen.guidance_scale!,
        safetyFilter: newGen.enable_safety_checker!,
        prompt: newGen.prompt || (newGen.model === UpscaleModel.BytedanceVideo ? "Video upscale" : "Image upscale"),
        negativePrompt: newGen.negative_prompt || "",
        nsfwFlag: false,
        generationTime: new Date(),
        reason: {},
        creditUsed: (typeof creditCosts?.[ToolType.IMAGE_UPSCALER] === 'number'
          ? creditCosts[ToolType.IMAGE_UPSCALER] as number
          : 3
        ) ?? 3,
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
              heading="Image Upscaler"
              description="Enhance and upscale your images with AI"
              icon={<Image className="h-6 w-6" />}
            >
              <CreditCostDisplay
                creditCosts={creditCosts}
                toolType={ToolType.IMAGE_UPSCALER}
              />
            </AiAnimatedHeading>

            <HowToUseDrawer
              headerTitle="🔍 Quick Guide: AI Image Upscale"
              headerDescription="Enhance image resolution without losing quality."
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Upload Image:</strong> Select the image you want to upscale.</p>
                <p><strong>Choose Scale:</strong> Pick 2×, 4×, or your desired resolution level.</p>
                <p><strong>Enable Face Enhancement (Optional):</strong> Improve facial details if needed.</p>
                <p><strong>Apply Upscale:</strong> Click “Upscale” to start processing.</p>
                <p><strong>Preview & Download:</strong> Check the high-resolution image and save it.</p>
                <p className="text-xs italic text-muted-foreground">
                  Tip: Start with the best quality image you have for the sharpest results.
                </p>
              </div>
            </HowToUseDrawer>
          </div>

          <div className="hidden sm:block text-sm text-muted-foreground self-end">
            Configure on the left → upscale on the left panel
          </div>
        </div>

        {/* content */}
        <div className="w-full pt-8">
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <aside className="rounded-2xl border border-border bg-card/60 p-3 h-fit xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:flex xl:flex-col">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Upscaling Settings
              </h3>

              <div className="xl:overflow-y-auto xl:pr-1">
                <Settings
                  form={form}
                  setForm={setForm}
                  imageUploadRef={uploadRefs}
                />
              </div>

              <div className="pt-2 border-t border-border mt-2 sticky bottom-0 bg-card/95 backdrop-blur xl:mt-auto">
                <ActionButtons
                  handleGenerate={handleGenerate}
                  isLoading={isLoading}
                  isGenerating={isGenerating}
                  creditCosts={creditCosts!}
                  toolType={ToolType.IMAGE_UPSCALER}
                  variant={getUpscaleVariant(form)}
                  generateLabel="Upscale"
                />
              </div>
            </aside>

            <div>
              <UpscaleHistory
                history={generations}
                isLoading={isLoadingImages}
                onDelete={fetchImages}
                pollingRefs={pollingRefs}
              />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
