import { BlurImage } from "@/components/blur-image";
import { CreditCost } from "@/components/credit-cost";
import { useUserContext } from "@/components/layout/user-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createImageJob } from "@/lib/validation/create-image-job";
// import { defaultImageForm, ImageGenerationForm } from "@/types/image";
import { AspectRatio, GeneratedImage, ToolType } from "@prisma/client";
import { Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface GeneratePhotosStepProps {
  currentStep: number;
  done: boolean;
}


export default function ImageGenerationStep({
  currentStep, done
}: GeneratePhotosStepProps) {
  const { userId, isLoading, availableCredit, creditCosts } = useUserContext()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  // const [form, setForm] = useState<ImageGenerationForm>(defaultImageForm);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const examplePrompt = "Hyper-realistic portrait of a beautiful woman with long wavy hair, professional studio lighting, confident expression, looking directly at camera, high fashion style, ultra-detailed, 8K resolution"

  // const generateImage = async () => {

  //   if (!prompt.trim()) {
  //     toast.error("Please enter a prompt");
  //     return;
  //   }

  //   try {
  //     setIsGenerating(true);

  //     toast.loading("Submitting image generation job...");

  //     const job = createImageJob({
  //       model: "none",
  //       prompt: prompt,
  //       aspectRatio: form.aspectRatio,
  //       numImages: form.numImages,
  //       safetyEnabled: form.safetyEnabled,
  //       safetyLevel: form.safetyLevel,
  //       numInferenceStep: form.numInferenceStep,
  //       guidanceScale: form.guidanceScale,
  //       outputFormat: form.outputFormat,
  //       trainingPhoto: form.trainingPhoto,
  //       trainingPhotoUrls: form.trainingPhotoUrls
  //     });

  //     const res = await fetch("/api/tools/image", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(job),
  //     });

  //     toast.dismiss();

  //     if (!res.ok) throw new Error("Image generation failed");

  //     const { jobId } = await res.json();
  //     const newImage: GeneratedImage = {
  //       id: jobId,
  //       userId: userId as string,
  //       imageUrl: "",
  //       prompt: form.prompt,
  //       aspectRatio: form.aspectRatio as AspectRatio,
  //       contentType: "sfw",
  //       variant: "sfw",
  //       nsfwFlag: false,
  //       generationTime: new Date(),
  //       status: "queued",
  //       creditUsed: 0,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     };

  //     setImages((prev) => [newImage, ...prev]);
  //     pollJobStatus(jobId);

  //     setPrompt("")
  //     setForm(defaultImageForm)

  //     toast.success("Image generation started!");
  //   } catch (err: any) {
  //     toast.error(err.message);
  //   } finally {
  //     setIsGenerating(false);

  //     // if (isMobileSettingsOpen) {
  //     //   setIsMobileSettingsOpen(false)
  //     // }
  //   }
  // };

  // const pollJobStatus = (jobId: string) => {
  //   if (pollingRefs.current[jobId]) return;

  //   const interval = setInterval(async () => {
  //     try {
  //       const res = await fetch(`/api/tools/image/status/${jobId}`);
  //       const data = await res.json();

  //       if (["completed", "failed"].includes(data.status)) {
  //         clearInterval(pollingRefs.current[jobId]);
  //         delete pollingRefs.current[jobId];
  //         // refetch();
  //       }

  //       setImages((prev) =>
  //         prev.map((img) =>
  //           img.id === jobId
  //             ? { ...img, status: data.status, imageUrl: data.imageUrl }
  //             : img
  //         )
  //       );
  //     } catch (err) {
  //       console.error(`Polling error for job ${jobId}`, err);
  //     }
  //   }, 5000);

  //   pollingRefs.current[jobId] = interval;
  // };


  return (
    <div>
      {/* Step 3: Generate Photos Showcase */}
      {currentStep === 2 && (
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-white text-3xl font-bold mb-4">Image Generation</h3>
            <p className="text-white/70 text-lg">
              Use prompts to create stunning images with your trained AI influencer
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left side - Prompt showcase */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium">Example Prompt:</h4>
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <p className="text-sm text-white/90 leading-relaxed">{examplePrompt}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white/80 font-medium">Generation Settings:</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Quality</span>
                    <span className="text-sm text-indigo-400">Ultra High</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Style</span>
                    <span className="text-sm text-indigo-400">Realistic</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Content Type</span>
                    <span className="text-sm text-indigo-400">SFW</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Credits Used</span>
                    <span className="text-sm text-indigo-400">10</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right side - Generated result */}
            <div className="space-y-6">
              <div className="aspect-square rounded-lg overflow-hidden border border-white/10">
                <BlurImage
                  src={"/ai-portrait-preview.png"}
                  alt={"Generated image"}
                  className="w-full h-full object-cover"
                  aspectRatio={4 / 3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                  <span className="mr-2">⬆️</span>
                  Upscale
                </Button>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                  <span className="mr-2">🎨</span>
                  Enhance
                </Button>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                  <span className="mr-2">⬇️</span>
                  Download
                </Button>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                  <span className="mr-2">🔄</span>
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Step 3: Generate Photos Showcase */}
      {
        currentStep === 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-white text-3xl font-bold mb-4">Step 4: Generate Photos</h3>
              <p className="text-white/70 text-lg">
                Use prompts to create stunning images with your trained AI influencer
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left side - Prompt showcase */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Prompt:</h4>
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <Textarea
                      className="min-h-[100px]"
                      placeholder="Describe the image you want to generate..."
                      value={prompt}
                      rows={4}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  <Button
                    variant="default"
                    className="gap-2"
                    // onClick={generateImage}
                    disabled={
                      isLoading || isGenerating || ((availableCredit ?? 0) < 5)
                    }
                  >
                    {(isLoading || isGenerating) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isGenerating ? "Generating..." : "Loading"}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Image
                        <CreditCost
                          creditCosts={creditCosts}
                          toolType={ToolType.IMAGE_GENERATOR}
                        />
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white/80 font-medium">Generation Settings:</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white/80 text-sm">Quality</span>
                      <span className="text-sm text-indigo-400">Ultra High</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white/80 text-sm">Style</span>
                      <span className="text-sm text-indigo-400">Realistic</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white/80 text-sm">Content Type</span>
                      <span className="text-sm text-indigo-400">SFW</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white/80 text-sm">Credits Used</span>
                      <span className="text-sm text-indigo-400">10</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right side - Generated result */}
              <div className="space-y-6">
                <div className="aspect-square rounded-lg overflow-hidden border border-white/10">
                  <BlurImage
                    src={(images && images?.[0]?.imageUrl) ?? ""}
                    alt={"Generated image"}
                    className="w-full h-full object-cover"
                    aspectRatio={4 / 3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                    <span className="mr-2">⬆️</span>
                    Upscale
                  </Button>
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                    <span className="mr-2">🎨</span>
                    Enhance
                  </Button>
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                    <span className="mr-2">⬇️</span>
                    Download
                  </Button>
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white/80 bg-transparent">
                    <span className="mr-2">🔄</span>
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}
