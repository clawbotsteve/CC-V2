"use client";

import { Textarea } from "@/components/ui/textarea";
import { updateForm } from "@/lib/utils";
import { PromptGenerationInput } from "@/types/prompt";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { OptimizePromptButton } from "@/components/optimize-prompt-button";

type Props = {
  form: PromptGenerationInput;
  setForm: React.Dispatch<React.SetStateAction<PromptGenerationInput>>;
  imageUploadRef: Record<string, React.RefObject<ImageUploadHandle | null>>;
};
const labeledOptions = <T extends string>(
  options: T[]
): { label: string; value: T }[] => options.map((value) => ({ label: value, value }));

const DROPDOWNS = [
  {
    label: "Visual Style",
    key: "style",
    options: labeledOptions([
      "Minimalist",
      "Simple",
      "Detailed",
      "Descriptive",
      "Dynamic",
      "Cinematic",
      "Documentary",
      "Animation",
      "Action",
      "Experimental",
    ]),
  },
  {
    label: "Camera Style",
    key: "camera_style",
    options: labeledOptions([
      "None",
      "Steadicam flow",
      "Drone aerials",
      "Handheld urgency",
      "Crane elegance",
      "Dolly precision",
      "VR 360",
      "Multi-angle rig",
      "Static tripod",
      "Gimbal smoothness",
      "Slider motion",
      "Jib sweep",
      "POV immersion",
      "Time-slice array",
      "Macro extreme",
      "Tilt-shift miniature",
      "Snorricam character",
      "Whip pan dynamics",
      "Dutch angle tension",
      "Underwater housing",
      "Periscope lens",
    ]),
  },
  {
    label: "Camera Direction",
    key: "camera_direction",
    options: labeledOptions([
      "None",
      "Zoom in",
      "Zoom out",
      "Pan left",
      "Pan right",
      "Tilt up",
      "Tilt down",
      "Orbital rotation",
      "Push in",
      "Pull out",
      "Track forward",
      "Track backward",
      "Spiral in",
      "Spiral out",
      "Arc movement",
      "Diagonal traverse",
      "Vertical rise",
      "Vertical descent",
    ]),
  },
  {
    label: "Pacing",
    key: "pacing",
    options: labeledOptions([
      "None",
      "Slow burn",
      "Rhythmic pulse",
      "Frantic energy",
      "Ebb and flow",
      "Hypnotic drift",
      "Time-lapse rush",
      "Stop-motion staccato",
      "Gradual build",
      "Quick cut rhythm",
      "Long take meditation",
      "Jump cut energy",
      "Match cut flow",
      "Cross-dissolve dreamscape",
      "Parallel action",
      "Slow motion impact",
      "Ramping dynamics",
      "Montage tempo",
      "Continuous flow",
      "Episodic breaks",
    ]),
  },
  {
    label: "Special Effects",
    key: "special_effects",
    options: labeledOptions([
      "None",
      "Practical effects",
      "CGI enhancement",
      "Analog glitches",
      "Light painting",
      "Projection mapping",
      "Nanosecond exposures",
      "Double exposure",
      "Smoke diffusion",
      "Lens flare artistry",
      "Particle systems",
      "Holographic overlay",
      "Chromatic aberration",
      "Digital distortion",
      "Wire removal",
      "Motion capture",
      "Miniature integration",
      "Weather simulation",
      "Color grading",
      "Mixed media composite",
      "Neural style transfer",
    ]),
  },
  {
    label: "Prompt Length",
    key: "prompt_length",
    options: labeledOptions(["Short", "Medium", "Long"]),
  },
  {
    label: "Model",
    key: "model",
    options: labeledOptions([
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3-5-haiku",
      "anthropic/claude-3-haiku",
      "google/gemini-pro-1.5",
      "google/gemini-flash-1.5",
      "google/gemini-flash-1.5-8b",
      "meta-llama/llama-3.2-1b-instruct",
      "meta-llama/llama-3.2-3b-instruct",
      "meta-llama/llama-3.1-8b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
      "deepseek/deepseek-r1"
    ]),
  },
];

export default function PromptGenerationSettings({ form, setForm, imageUploadRef }: Props) {
  const { image_url } = imageUploadRef

  return (
    <div className="space-y-6 py-2">
      {/* Input Concept */}
      <div className="space-y-2 py-2">
        <label className="text-sm font-medium">Input Concept</label>
        <Textarea
          className="min-h-[80px]"
          placeholder="e.g. A heroic journey through a futuristic city"
          value={form.input_concept ?? ""}
          onChange={(e) => updateForm(setForm, { input_concept: e.target.value })}
        />
        <OptimizePromptButton
          prompt={form.input_concept ?? ""}
          imageUrl={form.image_url}
          imageUploadRef={image_url}
          onOptimized={(optimizedPrompt) => updateForm(setForm, { input_concept: optimizedPrompt })}
          size="sm"
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Reference Image (optional)</label>
        <ImageUpload
          fieldName="referenceImage"
          ref={image_url}
          data={{ referenceImage: form.referenceImage }}
          update={(data) => updateForm(setForm, data)}
        />
      </div>

      {/* Dropdown Selects */}
      {DROPDOWNS.map(({ label, key, options }) => (
        <div className="space-y-2 py-2" key={key}>
          <label className="text-sm font-medium">{label}</label>
          <select
            className="w-full h-10 px-3 py-2 rounded-md border text-sm bg-background"
            value={(form as any)[key]}
            onChange={(e) => updateForm(setForm, { [key]: e.target.value })}
          >
            {options.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Custom Elements */}
      <div className="space-y-2 py-2">
        <label className="text-sm font-medium">Custom Elements</label>
        <Textarea
          className="min-h-[80px]"
          placeholder="e.g. Include glowing neon signs and cyberpunk umbrellas"
          value={form.custom_elements ?? ""}
          onChange={(e) => updateForm(setForm, { custom_elements: e.target.value })}
        />
      </div>

      {/* Safety Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Content Type
        </label>
        <div className="flex gap-4">
          <Button
            variant={form.enable_safety_checker ? "default" : "outline"}
            className="flex-1"
            onClick={() => setForm(f => ({ ...f, enable_safety_checker: true }))}
          >
            SFW
          </Button>
          <Button
            variant={!form.enable_safety_checker ? "default" : "outline"}
            className="flex-1"
            onClick={() => setForm(f => ({ ...f, enable_safety_checker: false }))}
          >
            NSFW
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Filters potentially unsafe content (recommended to keep enabled)
        </p>
      </div>
    </div>
  );
}
