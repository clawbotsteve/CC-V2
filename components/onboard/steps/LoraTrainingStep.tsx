import { StepContentUploadHandle } from "@/app/(dashboard)/(routes)/tools/influencers/_components/StepContentUpload";
import StepOnboardingUpload from "@/app/(dashboard)/(routes)/tools/influencers/_components/StepOnboardingUpload";
import { CreditCost } from "@/components/credit-cost";
import { useUserContext } from "@/components/layout/user-context";
import { Button } from "@/components/ui/button";
import { updateForm } from "@/lib/utils";
import { defaultInfluencerForm, InfluencerJobInput } from "@/types/influencer";
import { ToolType } from "@prisma/client";
import { Loader2, Sparkle, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface LoraTrainingStepProps {
  currentStep: number;
  done: boolean;
}


export default function LoraTrainingStep({
  currentStep, done
}: LoraTrainingStepProps) {
  const { userId, isLoading, plan, availableCredit, creditCosts } = useUserContext()

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<InfluencerJobInput>(defaultInfluencerForm);
  const contentUploadRef = useRef<StepContentUploadHandle>(null);

  const createInfluencer = async () => {
    setLoading(true);

    try {
      const uploadResult = await contentUploadRef.current?.upload();

      if (
        !uploadResult ||
        !uploadResult.trainingDataUrl?.length ||
        !uploadResult.firstImageUrl
      ) {
        toast.error("Please upload at least one training photo.");
        setLoading(false);
        return;
      }

      const { trainingDataUrl, firstImageUrl } = uploadResult;

      const newForm = {
        ...form,
        trainingFileUrl: trainingDataUrl,
        avatarImageurl: firstImageUrl,
        plan: plan,
      };

      setForm(newForm);

      // Send to API
      const res = await fetch("/api/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to create influencer");
      }

      const { influencer, jobId } = await res.json();
      toast.success("Influencer created successfully!");

      setForm(defaultInfluencerForm);
      contentUploadRef.current?.reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to create influencer");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Step 2: Upload Images Showcase */}
      {currentStep === 2 && (
        <div className="space-y-8 overflow-y-auto thin-scrollbar relative">
          <div className="text-center">
            <h3 className="text-white text-3xl font-bold mb-4">Step 2: Upload Reference Images</h3>
            <p className="text-white/70 text-lg">
              Upload 8-10 reference images to train your custom AI model (LoRA)
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left side - Upload area showcase */}
            <div className="space-y-6 relative">
              <StepOnboardingUpload
                ref={contentUploadRef}
                data={form}
                update={(e) => updateForm(setForm, e)}
              />

              <div className="absolute bottom-0 right-0">
                <Button
                  variant="default"
                  className="gap-2"
                  // onClick={createInfluencer}
                  disabled={
                    loading || plan === "plan_free" || ((availableCredit ?? 0) < 65)
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Train Influencer
                      <CreditCost
                        creditCosts={creditCosts}
                        toolType={ToolType.AVATAR_TRAINING}
                      />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right side - Training process */}
            <div className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-600/10 border border-indigo-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-xl">✨</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">AI Model Training Complete!</h4>
                    <p className="text-sm text-white/70">LoRA model trained successfully</p>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full w-full" />
                </div>
                <p className="text-sm text-green-400 text-center">✓ Ready to generate content</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium">What happens during training:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs text-blue-400">1</span>
                    </div>
                    <span className="text-white/80 text-sm">AI analyzes facial features and characteristics</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs text-blue-400">2</span>
                    </div>
                    <span className="text-white/80 text-sm">Creates a personalized LoRA model</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs text-blue-400">3</span>
                    </div>
                    <span className="text-white/80 text-sm">Model ready for content generation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
