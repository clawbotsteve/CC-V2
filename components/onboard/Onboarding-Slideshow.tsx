"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import ImageGenerationStep from "./steps/ImageGenerationStep";
import VideoGenerationStep from "./steps/VideoGenerationStep";
import FaceEnhancementStep from "./steps/FaceEnhancementStep";
import CreateInfluencerCTAStep from "./steps/CreateInfluencerCTAStep";

export default function OnboardingSlideshow({
  onClose,
}: {
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToStep = (step: number) => setCurrentStep(step);

  const stepGroups = [
    { group: 1, label: "Welcome", icon: "👋" },
    { group: 2, label: "Image Generation", icon: "🖼️" },
    { group: 3, label: "Video Generation", icon: "🎬" },
    { group: 4, label: "Upscale & Enhance", icon: "✨" },
    { group: 5, label: "Create AI Influencer", icon: "🚀" },
  ];

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-foreground/75 dark:bg-background border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative flex flex-col">
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
          <div className="text-sm text-white/50">
            {currentStep} of {totalSteps}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20"
          >
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
                  onClick={() => goToStep(group)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      group < currentStep
                        ? "bg-green-500 text-white"
                        : group === currentStep
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {group < currentStep ? "✓" : icon}
                  </div>
                  <span
                    className={`text-xs hidden sm:inline ${
                      group <= currentStep ? "text-white" : "text-white/50"
                    }`}
                  >
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
        <div className="p-8 sm:p-12 lg:p-16 pt-4 overflow-y-auto flex-1">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl">
                  👋
                </div>
              </div>

              <div className="text-center space-y-4">
                <h2 className="text-white text-3xl font-bold">
                  Welcome to Tavira Labs
                </h2>
                <p className="text-white/70 text-lg max-w-lg mx-auto">
                  Your all-in-one AI content studio. Generate images, create
                  videos, upscale quality, and build custom AI influencers —
                  all in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[
                  { icon: "🖼️", label: "AI Images", desc: "Generate stunning photos" },
                  { icon: "🎬", label: "AI Videos", desc: "Create dynamic content" },
                  { icon: "✨", label: "Upscale", desc: "Enhance to 4K quality" },
                  { icon: "🧬", label: "AI Influencer", desc: "Train your own model" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-2"
                  >
                    <div className="text-2xl">{item.icon}</div>
                    <div className="text-white text-sm font-medium">
                      {item.label}
                    </div>
                    <div className="text-white/50 text-xs">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold px-8 py-3 rounded-xl"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Image Generation */}
          <ImageGenerationStep currentStep={currentStep} done={false} />

          {/* Step 3: Video Generation */}
          <VideoGenerationStep currentStep={currentStep} />

          {/* Step 4: Upscale & Enhance */}
          <FaceEnhancementStep currentStep={currentStep} done={false} />

          {/* Step 5: Create AI Influencer CTA */}
          <CreateInfluencerCTAStep
            currentStep={currentStep}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
