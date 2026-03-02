"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

import StepBasicInfo from "./StepBasicInfo";
import StepContentUpload, {
  StepContentUploadHandle,
} from "./StepContentUpload";
import { toast } from "sonner";
import { useUserContext } from "@/components/layout/user-context";
import { CreditCost } from "@/components/credit-cost";
import { ToolType } from "@prisma/client";
import { defaultInfluencerForm, InfluencerJobInput, InfluencerModel } from "@/types/influencer";
import { updateForm } from "@/lib/utils";

const steps = [
  { label: "Basic Info", description: "Name and description" },
  { label: "Training Data", description: "Upload training photos" },
  { label: "Review", description: "Review and confirm" },
];

interface InfluencerCreateDialogProps {
  open: boolean;
  initialModel?: InfluencerModel;
  onOpenChange: (open: boolean) => void;
  onCreateSuccess: (influencer: any, jobId: string) => void;
}

export default function InfluencerCreateDialog({
  open,
  initialModel,
  onOpenChange,
  onCreateSuccess,
}: InfluencerCreateDialogProps) {
  const { userId, plan, availableCredit, creditCosts } = useUserContext();

  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState<InfluencerJobInput>(defaultInfluencerForm);

  const contentUploadRef = React.useRef<StepContentUploadHandle>(null);

  function back() {
    if (loading) return;
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  function next() {
    if (loading) return;
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  }

  function validateForm(): string | null {
    if (!form.name || form.name.trim() === "") {
      return "Name is required";
    }
    if (!form.description || form.description.trim() === "") {
      return "Description is required";
    }

    if (form.model === InfluencerModel.FLUX_2) {
      if (!form.defaultCaption || form.defaultCaption.trim() === "") {
        return "Default Caption is required for FLUX-2 model";
      }
    }

    return null; // No errors
  }

  async function createInfluencer() {
    if (loading) return;
    setLoading(true);

    if (!userId) {
      toast.error("User not authenticated");
      setLoading(false);
      return;
    }

    // Validate form before submitting
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      setLoading(false);
      return;
    }

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

      onCreateSuccess(influencer, jobId);
      
      setCurrentStep(0);
      setForm(defaultInfluencerForm);
      contentUploadRef.current?.reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to create influencer");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setForm(defaultInfluencerForm);
      contentUploadRef.current?.reset();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || !initialModel) return;
    setForm((prev) => ({ ...prev, model: initialModel }));
  }, [open, initialModel]);

  function renderReview() {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          Review Influencer Details
        </h3>
        <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            <strong>Name:</strong> {form.name || "-"}
          </li>
          <li>
            <strong>Description:</strong> {form.description || "-"}
          </li>
          <li>
            <strong>Model:</strong> {form.model}
          </li>
          {form.model === InfluencerModel.FLUX_2 && form.learningRate && (
            <li>
              <strong>Learning Rate:</strong> {form.learningRate}
            </li>
          )}
          {form.mode === "style" && (
            <li>
              <strong>Trigger Word:</strong> {form.trigger || "-"}
            </li>
          )}

          <li>
            <strong>Training Photos:</strong>{" "}
            {form.trainingPhoto.length > 0
              ? `${form.trainingPhoto.length} file(s)`
              : "-"}
          </li>

          {form.model === InfluencerModel.FLUX_2 && form.defaultCaption && (
            <li>
              <strong>Default Caption:</strong> {form.defaultCaption}
            </li>
          )}

          {/* Privacy & Content Type */}
          <li>
            <strong>Visibility:</strong>{" "}
            <span className={form.isPublic ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400"}>
              {form.isPublic ? "Public" : "Private"}
            </span>
          </li>
          <li>
            <strong>Content Type:</strong>{" "}
            <span className={form.contentType === "sfw" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {form.contentType.toUpperCase()}
            </span>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="w-screen h-screen max-w-none max-h-none m-0 rounded-none flex flex-col sm:rounded-none"
        aria-describedby="influencer-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Create AI Influencer</DialogTitle>
          <p id="influencer-dialog-description" className="sr-only">
            Create a new AI influencer by providing basic information and uploading training photos
          </p>
        </DialogHeader>

        {/* Stepper */}
        <div 
          className="grid items-start justify-start w-full gap-4 max-md:hidden mb-6" 
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0px, 1fr))` }}
        >
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            const isUpcoming = i > currentStep;

            return (
              <div key={step.label} className="flex w-full flex-col items-center justify-center gap-3">
                <div className="relative flex w-full flex-col items-center self-stretch">
                  {/* Step Circle */}
                  <span
                    className={`z-10 flex items-center justify-center rounded-full size-6 ${
                      isDone
                        ? "bg-indigo-600 text-white"
                        : isActive
                          ? "bg-indigo-600 ring-1 ring-inset ring-indigo-300 text-white"
                          : "bg-white ring-1 ring-inset ring-gray-300 text-gray-500 opacity-60"
                    }`}
                  >
                    {isDone ? (
                      <Check className="size-3" strokeWidth={2.5} />
                    ) : (
                      <span className="font-semibold text-xs">{i + 1}</span>
                    )}
                  </span>
                  
                  {/* Connecting Line */}
                  {i < steps.length - 1 && (
                    <svg
                      className="absolute top-1/2 left-[53%] z-0 h-[2.5px] w-full flex-1 -translate-y-1/2 max-md:hidden"
                      viewBox="0 0 100 2"
                      preserveAspectRatio="none"
                    >
                      <line
                        x1="0"
                        y1="1"
                        x2="100"
                        y2="1"
                        className={isDone ? "stroke-indigo-600" : "stroke-gray-300"}
                        strokeWidth="2.4"
                        strokeDasharray="0,6"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                
                {/* Step Labels */}
                <div
                  className={`flex w-full flex-col items-start self-stretch gap-0 ${
                    isUpcoming ? "opacity-60" : ""
                  }`}
                >
                  <p
                    className={`w-full text-center text-sm font-semibold ${
                      isActive
                        ? "text-indigo-600"
                        : isDone
                          ? "text-indigo-600"
                          : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`w-full text-center text-sm ${
                      isActive
                        ? "text-gray-600 dark:text-gray-400"
                        : isDone
                          ? "text-gray-600 dark:text-gray-400"
                          : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div style={{ display: currentStep === 0 ? "block" : "none" }}>
            <StepBasicInfo data={form} update={(e) => updateForm(setForm, e)} />
          </div>
          <div style={{ display: currentStep === 1 ? "block" : "none" }}>
            <StepContentUpload
              ref={contentUploadRef}
              data={form}
              update={(e) => updateForm(setForm, e)}
            />

            {/* Default Caption - only show if model is flux-2 */}
            {form.model === InfluencerModel.FLUX_2 && (
              <div className="mt-6 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  Default Caption
                  <span className="text-xs text-muted-foreground font-normal">
                    (Describe what's in your images)
                  </span>
                </label>
                <textarea
                  placeholder="Enter default caption for training images..."
                  value={form.defaultCaption || ""}
                  onChange={(e) => updateForm(setForm, { defaultCaption: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 text-sm border-2 border-muted bg-muted/50 rounded-md hover:bg-accent focus:border-blue-500 focus:bg-blue-100/60 focus:dark:bg-blue-900/20 focus:text-blue-800 focus:dark:text-blue-300 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  💡 This description will be applied to all training images without individual .txt caption files.
                </p>
              </div>
            )}
          </div>
          <div style={{ display: currentStep === 2 ? "block" : "none" }}>
            {renderReview()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <DialogFooter className="flex !justify-start gap-3 mt-4 sm:!justify-start">
          {currentStep > 0 && (
            <Button variant="outline" onClick={back} disabled={loading}>
              Back
            </Button>
          )}

          {currentStep < steps.length - 1 && (
            <Button onClick={next} disabled={loading}>
              Next
            </Button>
          )}

          {currentStep === steps.length - 1 && (
            <Button
              onClick={createInfluencer}
              disabled={
                loading || plan === "plan_free" || ((availableCredit ?? 0) < 65)
              }
            >
              <CreditCost
                creditCosts={creditCosts}
                toolType={ToolType.AVATAR_TRAINING}
              />
              {loading ? "Creating..." : "Create Influencer"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
