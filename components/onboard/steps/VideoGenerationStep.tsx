import { useUserContext } from "@/components/layout/user-context";
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea";
// import { createVideoJob } from "@/lib/validation/create-video-job";
import { defaultVideoGenerationForm, VideoGenerationForm } from "@/types/video";
import { GeneratedVideo } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface GenerateVideosStepProps {
  currentStep: number;
}

export default function VideoGenerationStep({
  currentStep,
}: GenerateVideosStepProps) {
  const { userId, isLoading, availableCredit, creditCosts } = useUserContext()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const [form, setForm] = useState<VideoGenerationForm>(defaultVideoGenerationForm);

  const exampleVideoPrompt = "Subtle smile, gentle head movement, soft natural lighting, sitting pose, elegant and confident, slow motion effect"

  return (
    <div>
      {/* Step 5: Generate Videos Showcase */}
      {currentStep === 3 && (
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-white text-3xl font-bold mb-4">Video Generation</h3>
            <p className="text-white/70 text-lg">Create dynamic video content with your AI influencer</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left side - Video prompt showcase */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium">Example Video Prompt:</h4>
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <p className="text-sm text-white/90 leading-relaxed">{exampleVideoPrompt}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white/80 font-medium">Video Settings:</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Duration</span>
                    <span className="text-sm text-indigo-400">5 seconds</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Quality</span>
                    <span className="text-sm text-indigo-400">HD 1080p</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Frame Rate</span>
                    <span className="text-sm text-indigo-400">24 FPS</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-white/80 text-sm">Credits Used</span>
                    <span className="text-sm text-indigo-400">30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Generated video */}
            <div className="space-y-6">
              <div className="aspect-video rounded-lg overflow-hidden bg-black relative border border-white/10">
                <img src="/video-thumbnail.png" alt="Video thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">▶️</span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                  <span className="text-xs text-white">5.0s • HD</span>
                </div>
                <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="text-xs text-green-400">Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white bg-transparent">
                  <span className="mr-2">⬇️</span>
                  Download MP4
                </Button>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:text-white bg-transparent">
                  <span className="mr-2">🔄</span>
                  Regenerate
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-sm font-bold text-blue-400">1080p</div>
                  <div className="text-xs text-white/70">Resolution</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-sm font-bold text-purple-400">24fps</div>
                  <div className="text-xs text-white/70">Frame Rate</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-sm font-bold text-green-400">5.2MB</div>
                  <div className="text-xs text-white/70">File Size</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
