"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Pencil, } from "lucide-react";
import PageContainer from "@/components/page-container";
import { useUserContext } from "@/components/layout/user-context";
import { GenerationStatus, ImageEdit, ToolType } from "@prisma/client";
import { ImageHistory } from "./_components/ImageHistory";
import { useCreditWarningModal } from "@/hooks/use-credit-warning";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { HowToUseDrawer } from "@/components/how-to-use-drawer";
import { CreditCostDisplay } from "@/components/credit-costs-display";
import { ActionButtons } from "@/components/generate-button";
import Settings from "./_components/Settings";
import { defaultImageEditorForm, ImageEditorInput } from "@/types/editor";
import { fetchGenerations } from "@/lib/fetch-generation";
import { pollGenerationStatus } from "@/lib/poll-generation-status";
import { createGeneration } from "@/lib/create-generation";
import { ImageUploadHandle } from "@/components/image-upload";

export default function ImageEditPage() {
  const endpoint = "/api/tools/editor"
  const { onOpen } = useCreditWarningModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { userId, refetch, plan, availableCredit, isLoading, dailyUsage, creditCosts } = useUserContext();
  const [generations, setGenerations] = useState<ImageEdit[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  const uploadRefs = {
    image_url: useRef<ImageUploadHandle>(null)
  }
  const [form, setForm] = useState<ImageEditorInput>(defaultImageEditorForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const handleGenerate = async () => {
    const newGen = await createGeneration({
      options: form,
      setOptions: setForm,
      defaultOptions: defaultImageEditorForm,
      userId: userId!,
      apiEndpoint: endpoint,
      buildPayload: (options) => options,
      uploadRefs: uploadRefs,
      callbacks: {
        refetch: fetchImages
      }
    });

    if (newGen) {
      const generatedImage: ImageEdit = {
        id: newGen.id,
        userId: newGen.userId,
        prompt: newGen.prompt,
        originalUrl: newGen.image_url,
        editedUrl: "",
        strength: newGen.strength,
        steps: newGen.num_inference_steps,
        adherence: newGen.guidance_scale!,
        count: newGen.num_images!,
        safe: newGen.enable_safety_checker!,
        nsfwFlag: false,
        generationTime: new Date(),
        reason: {},
        creditUsed: (typeof creditCosts?.[ToolType.IMAGE_EDITOR] === 'number'
          ? creditCosts[ToolType.IMAGE_EDITOR] as number
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

  useEffect(() => {
    const modelParam = searchParams.get("model");
    if (!modelParam) return;

    if (modelParam === "seedvr-image") {
      router.replace("/tools/image-upscale?model=seedvr-image", { scroll: false });
      return;
    }

    if (modelParam === "bytedance-video") {
      router.replace("/tools/image-upscale?model=bytedance-video", { scroll: false });
      return;
    }

    if (modelParam === "nano-banana-edit") {
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return (
    <PageContainer>
      <div className="w-full p-4 md:p-8">
        {/* header */}
        <div className="py-4 md:sticky top-0 z-[9] bg-background flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between border-b border-foreground/40">

          <div className="flex gap-6">
            <AiAnimatedHeading
              heading="Image Editor"
              description="Transform and edit your images with AI"
              icon={<Pencil className="h-6 w-6" />}
            >
              <CreditCostDisplay
                creditCosts={creditCosts}
                toolType={ToolType.IMAGE_EDITOR}
              />
            </AiAnimatedHeading>

            <HowToUseDrawer
              headerTitle="🖌️ Quick Guide: AI Image Editor"
              headerDescription="Edit and enhance your images with powerful AI tools."
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Upload Image:</strong> Choose the image you want to edit.</p>
                <p><strong>Select Tool:</strong> Pick from crop, adjust colors, remove background, or add effects.</p>
                <p><strong>Edit with Prompts (Optional):</strong> Describe changes like “make background blue” or “add sunglasses”.</p>
                <p><strong>Apply Changes:</strong> Click “Apply” to see edits in real time.</p>
                <p><strong>Undo or Redo:</strong> Fine-tune until you’re satisfied.</p>
                <p><strong>Download:</strong> Save your edited image in high quality.</p>
                <p className="text-xs italic text-muted-foreground">
                  Tip: Combine multiple edits for a creative and polished look.
                </p>
              </div>
            </HowToUseDrawer>
          </div>

          <div className="hidden sm:block text-sm text-muted-foreground self-end">
            Configure on the left → edit on the left panel
          </div>
        </div>

        {/* content */}
        <div className="w-full pt-8">
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <aside className="rounded-2xl border border-border bg-card/60 p-4 h-fit xl:sticky xl:top-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Image Editor Settings
              </h3>

              <Settings
                form={form}
                setForm={setForm}
                imageUploadRef={uploadRefs}
              />

              <div className="pt-4 border-t border-border mt-4">
                <ActionButtons
                  handleGenerate={handleGenerate}
                  isLoading={isLoading}
                  isGenerating={isGenerating}
                  creditCosts={creditCosts!}
                  toolType={ToolType.IMAGE_EDITOR}
                  generateLabel="Edit Image"
                />
              </div>
            </aside>

            <div>
              <ImageHistory
                images={generations}
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
