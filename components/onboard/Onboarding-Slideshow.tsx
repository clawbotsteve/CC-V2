import { BookUser, Check, ChevronLeft, ChevronRight, CreditCard, ListTodo, LoaderCircleIcon, LockKeyhole, X } from "lucide-react"
import { Button } from "../ui/button"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Confetti } from "../confetti"
import StepContentUpload from "@/app/(dashboard)/(routes)/tools/influencers/_components/StepContentUpload"
import StepOnboardingUpload from "@/app/(dashboard)/(routes)/tools/influencers/_components/StepOnboardingUpload"
import { BlurImage } from "../blur-image"
import { Stepper, StepperContent, StepperIndicator, StepperItem, StepperNav, StepperPanel, StepperSeparator, StepperTitle, StepperTrigger } from "../ui/stepper"
import { Badge } from "../ui/badge"
import ImageGenerationStep from "./steps/ImageGenerationStep"
import VideoGenerationStep from "./steps/VideoGenerationStep"
import LoraTrainingStep from "./steps/LoraTrainingStep"
import FaceEnhancementStep from "./steps/FaceEnhancementStep"

export default function OnboardingSlideshow({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const stepGroups = [
    { group: 1, label: "Welcome", icon: "📸", subSteps: [1] },
    { group: 2, label: "Influencer Training", icon: "📸", subSteps: [2] },
    { group: 3, label: "Generate Photos", icon: "✨", subSteps: [3] },
    { group: 4, label: "Enhance Quality", icon: "🎨", subSteps: [4] },
    { group: 5, label: "Create Videos", icon: "🎬", subSteps: [5] },
  ];

  function getCurrentGroup(currentStep: number) {
    const group = stepGroups.find((g) => g.subSteps.includes(currentStep));
    return group ? group.group : 1;
  }
  const currentGroup = getCurrentGroup(currentStep);

  // Calculate progress percentage for width bar (based on groups)
  const progressPercentage = (currentGroup / stepGroups.length) * 100;






  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-foreground/75 dark:bg-background border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative">
        {/* Navigation Arrows */}
        <Button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-black flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          onClick={nextStep}
          disabled={currentStep === totalSteps}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-black flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="text-sm text-white/50">
              {currentStep} of {totalSteps}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6">
              {stepGroups.map(({ group, label, icon }) => (
                <button
                  key={group}
                  onClick={() => {
                    // Go to first substep of this group
                    goToStep(stepGroups[group - 1].subSteps[0]);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${group < currentGroup
                      ? "bg-green-500 text-white"
                      : group === currentGroup
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 text-white/50"
                      }`}
                  >
                    {group < currentGroup ? "✓" : icon}
                  </div>
                  <span className={`text-xs ${group <= currentGroup ? "text-white" : "text-white/50"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>


        {/* Content */}
        <div className="p-20 pt-4">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="flex items-center justify-center p-6 border-b border-white/10">
                <h2 className="text-white text-2xl font-bold text-center">Welcome to CoreGen</h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl">
                    ✨
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-white text-xl font-bold">Your AI Content Studio Awaits</h3>
                  <p className="text-white/70">Transform your creative workflow with personalized AI models trained on your unique style.</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 text-center text-xs text-white/50">
                By continuing, you agree to our Terms and Privacy Policy
              </div>
            </div>
          )}

          <LoraTrainingStep currentStep={currentStep} done={true} />

          {/* Step 3: Generate Photos Showcase */}
          <ImageGenerationStep currentStep={currentStep} done={false} />

          <FaceEnhancementStep currentStep={currentStep} done={false} />

          <VideoGenerationStep currentStep={currentStep} />
        </div>
      </div>
    </div>
  )
}
