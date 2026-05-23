"use client";

import React, { useState, useEffect, useRef } from "react";
import { ToolType, type GeneratedVideo } from "@prisma/client";
import { Video, ImageUp, Sliders } from "lucide-react";
import { ToolHowItWorks, ToolStep } from "@/components/tool-how-it-works";
import { useUserContext } from "@/components/layout/user-context";
import { defaultVideoGenerationForm, VideoGenerationForm, getVideoVariant, getVideoCreditVariant } from "@/types/video";
import { updateForm } from "@/lib/utils";
import { VideoList } from "./_components/VideoList";
import VideoSettingsPanel from "./_components/VideoSettingsPanel";
import { useCreditWarningModal } from "@/hooks/use-credit-warning";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { HowToUseDrawer } from "@/components/how-to-use-drawer";
import { CreditCostDisplay } from "@/components/credit-costs-display";
import { ActionButtons } from "@/components/generate-button";
import { createGeneration } from "@/lib/create-generation";
import { fetchGenerations } from "@/lib/fetch-generation";
import { pollGenerationStatus } from "@/lib/poll-generation-status";
import PageContainer from "@/components/page-container";
import { ImageUploadHandle } from "@/components/image-upload";
import { VideoUploadHandle } from "@/components/video-upload";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { VideoModel } from "@/types/types";

// Empty-state onboarding step config for the video generator. Step 3
// uses an actual generated video so first-time users see the kind of
// output they can expect — way more compelling than an icon. Sample
// lives in /public/cc-content/ and is used elsewhere on the dashboard
// landing page, so swapping in a Seedance-specific clip later is just
// a one-line change here.
const VIDEO_GEN_STEPS: ToolStep[] = [
  {
    number: 1,
    title: "Upload Reference",
    description: "Drop an image of your subject — face, model, product, or scene.",
    icon: ImageUp,
  },
  {
    number: 2,
    title: "Configure",
    description: "Pick your model, resolution, duration, and aspect ratio. Add a prompt describing the action.",
    icon: Sliders,
  },
  {
    number: 3,
    title: "Generate",
    description: "Click Generate Video. Your finished clip lands here in seconds.",
    videoSrc: "/cc-content/video-2-landing.mp4",
  },
];

export default function GenerateVideoPage() {
  const endpoint = "/api/tools/video"
  const { onOpen } = useCreditWarningModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { userId, refetch, plan, availableCredit, isLoading, dailyUsage, creditCosts } = useUserContext();
  const [generations, setGenerations] = useState<GeneratedVideo[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isloadingVideos, setIsLoadingVideos] = useState(true);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const uploadRefs = {
    image_url: useRef<ImageUploadHandle>(null),
    video_url: useRef<VideoUploadHandle>(null)
  }
  const [form, setForm] = useState<VideoGenerationForm>(defaultVideoGenerationForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl');
    const modelParam = searchParams.get('model');

    if (modelParam) {
      const modelMap: Record<string, VideoModel> = {
        'kling-2.6': VideoModel.Kling,
        'kling-motion-control': VideoModel.KlingMotionControl,
        'seedance-2-ref': VideoModel.Seedance2Ref,
        // Deprecated 2026-04-29 — kept so old links don't crash; gated server-side.
        'bytedance': VideoModel.Bytedance,
        'veo-3.1': VideoModel.Veo,
        'veo': VideoModel.Veo,
      };
      const selectedModel = modelMap[modelParam];
      if (selectedModel) {
        setForm((f) => {
          const newVariant = getVideoVariant(selectedModel, f.duration);
          // Platform is SFW-only as of 2026-04-29; safety always on.
          const enable_safety_checker = true;
          return { ...f, model: selectedModel, variant: newVariant, enable_safety_checker };
        });
      }
    }

    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl);
      setPendingImageUrl(decodedUrl);
    }

    if (imageUrl || modelParam) {
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);


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
      defaultOptions: defaultVideoGenerationForm,
      userId: userId!,
      apiEndpoint: endpoint,
      buildPayload: (options) => {
        // createGeneration automatically maps uploadRefs keys to URLs
        // video_url will be set from uploadRefs.video_url upload
        return options;
      },
      uploadRefs: uploadRefs,
      callbacks: {
        refetch: fetchVideos
      }
    });


    if (newGen) {
      const generatedImage: GeneratedVideo = {
        id: newGen.id,
        userId: newGen.userId,
        model: "",
        prompt: newGen.prompt,
        negativePrompt: newGen.negative_prompt ?? null,
        duration: newGen.duration!,
        aspectRatio: "",
        videoUrl: null,
        adherence: newGen.cfg_scale ?? 0.5,
        contentType: "sfw",
        variant: newGen.variant,
        creditVariant: getVideoCreditVariant(form),
        nsfwFlag: false,
        generationTime: new Date(),
        reason: {},
        status: "queued",
        // Use the credit-variant (which is resolution-aware for Seedance —
        // e.g. seedance_v2_ref_720p_5s) so the optimistic history row shows
        // the same cost the user is actually charged. The legacy `form.variant`
        // (Prisma VideoVariant enum) doesn't carry resolution and would map to
        // the wrong cost for Seedance.
        creditUsed: (() => {
          const tv = creditCosts?.[ToolType.VIDEO_GENERATOR];
          if (typeof tv === "number") return tv;
          const creditVariant = getVideoCreditVariant(form);
          return (tv as Record<string, number> | undefined)?.[creditVariant] ?? 0;
        })(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setGenerations((prev) => [generatedImage, ...prev]);
      pollGenerationStatus({
        generationId: newGen.id,
        apiEndpoint: endpoint,
        setItems: setGenerations,
        pollingRefs: pollingRefs,
        refetch: fetchVideos,
        urlField: "videoUrl",
      });

    }
  };

  const fetchVideos = async (): Promise<void> => {
    await fetchGenerations({
      apiEndpoint: endpoint,
      setItems: setGenerations,
      pollingRefs: pollingRefs,
      refetch: fetchVideos,
      setIsLoading: setIsLoadingVideos,
    });
  };

  // inline settings panel (no modal close handler needed)

  useEffect(() => {
    fetchVideos();

    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  return (
    <PageContainer>
      <div className="w-full px-4 md:px-6 pt-1 md:pt-2 pb-4 md:pb-6">
        {/* header */}
        <div className="py-1 md:sticky top-0 z-[9] bg-background flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between border-b border-foreground/40">
          <div className="flex gap-6">
            <AiAnimatedHeading
              compact
              heading="Video Generator"
              description="Transform your images into videos with AI"
              icon={<Video className="h-6 w-6" />}
            >
              <CreditCostDisplay
                creditCosts={creditCosts}
                toolType={ToolType.VIDEO_GENERATOR}
              />
            </AiAnimatedHeading>

            <HowToUseDrawer
              headerTitle="🎬 Quick Guide: AI Video Generator"
              headerDescription="Follow these steps to create stunning AI-generated videos."
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Open Generator:</strong> Click “Generate Video”.</p>
                <p><strong>Enter Prompt:</strong> Describe the video scene you want.</p>
                <p><strong>Adjust Settings:</strong> Set duration, resolution, and style options.</p>
                <p><strong>Upload Reference (Optional):</strong> Add an image or short video for guidance.</p>
                <p><strong>Generate:</strong> Click “Generate” and let the AI create your video.</p>
                <p><strong>Preview & Download:</strong> Watch the video and download if satisfied.</p>
                <p className="text-xs italic text-muted-foreground">
                  Tip: Include clear descriptions of motion, style, and key elements for the best results.
                </p>
              </div>
            </HowToUseDrawer>

          </div>

          <div className="hidden sm:block text-sm text-muted-foreground self-end">
            Configure on the left → generate on the left panel
          </div>
        </div>

        {/* content */}
        <div className="w-full pt-3">
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <aside className="rounded-2xl border border-border bg-card/60 p-2.5 h-fit xl:sticky xl:top-16 xl:max-h-[calc(100vh-5rem)] xl:flex xl:flex-col">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Video Settings
              </h3>

              <div className="xl:overflow-y-auto xl:pr-1">
                <VideoSettingsPanel
                  form={form}
                  setForm={setForm}
                  updateForm={updateForm}
                  imageUploadRef={uploadRefs}
                />
              </div>

              <div className="pt-2 border-t border-border mt-2 sticky bottom-0 bg-card/95 backdrop-blur xl:mt-auto">
                <ActionButtons
                  handleGenerate={handleGenerate}
                  isLoading={isLoading}
                  isGenerating={isGenerating}
                  creditCosts={creditCosts!}
                  toolType={ToolType.VIDEO_GENERATOR}
                  variant={getVideoCreditVariant(form)}
                  generateLabel="Generate Video"
                />
              </div>
            </aside>

            <div>
              {/* Empty-state onboarding guide — shown only when the user
                  has no generations yet AND we're not still loading
                  (avoids a flash of the guide before the user's history
                  resolves). Disappears the moment they've made one
                  video, so returning users aren't visually nagged. */}
              {!isloadingVideos && generations.length === 0 ? (
                <ToolHowItWorks
                  title="Make videos in three clicks"
                  subtitle="Upload a reference image, set your shot, and generate. Your video lands in seconds."
                  steps={VIDEO_GEN_STEPS}
                />
              ) : (
                <VideoList
                  videos={generations}
                  isLoading={isloadingVideos}
                  onDelete={fetchVideos}
                  pollingRefs={pollingRefs}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
