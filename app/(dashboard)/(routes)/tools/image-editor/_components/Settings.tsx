"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Acceleration } from "@/types/types";
import { updateForm } from "@/lib/utils";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import { ImageEditorInput } from "@/types/editor";
import { OptimizePromptButton } from "@/components/optimize-prompt-button";

type Props = {
  form: ImageEditorInput;
  setForm: React.Dispatch<React.SetStateAction<ImageEditorInput>>;
  imageUploadRef: Record<string, React.RefObject<ImageUploadHandle | null>>;
};

export default function Settings({ form, setForm, imageUploadRef }: Props) {
  const { image_url } = imageUploadRef

  return (
    <div className="space-y-8">

      {/* Image Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Reference Image</label>
        <ImageUpload
          fieldName="referenceImage"
          ref={image_url}
          data={{ referenceImage: form.referenceImage }}
          update={(data) => updateForm(setForm, data)}
        />
      </div>

      {/* Prompt */}
      <div className="space-y-1 py-2">
        <label className="text-sm font-medium text-foreground">Prompt</label>
        <Textarea
          className="min-h-[100px]"
          placeholder="Describe the image you want to generate..."
          value={form.prompt}
          onChange={(e) => updateForm(setForm, { prompt: e.target.value })}
        />
        <OptimizePromptButton
          prompt={form.prompt}
          imageUrl={form.image_url}
          imageUploadRef={image_url}
          onOptimized={(optimizedPrompt) => updateForm(setForm, { prompt: optimizedPrompt })}
          size="sm"
          className="w-full"
        />
      </div>

      {/* Acceleration */}
      <div className="space-y-1 py-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Acceleration</label>
          <span className="text-sm font-medium">{form.acceleration?.toLocaleUpperCase()}</span>
        </div>
        <div className="flex gap-2">
          {[Acceleration.None, Acceleration.Regular, Acceleration.High].map(n => (
            <button
              key={n}
              onClick={() => setForm(f => ({ ...f, acceleration: n }))}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium border
                ${form.acceleration === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-muted"}`}
            >
              {n.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Strength */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            Strength: {form.strength}
          </label>
        </div>
        <Slider
          defaultValue={[form.strength ?? 0.75]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(val) => setForm(f => ({ ...f, strength: val[0] }))}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Controls how much the original image is modified (0 = minimal, 1 =
          maximum)
        </p>
      </div>

      {/* Inference Steps */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            Inference Steps: {form.num_inference_steps}
          </label>
        </div>
        <Slider
          defaultValue={[form.num_inference_steps ?? 28]}
          min={10}
          max={50}
          step={1}
          onValueChange={(val) => setForm(f => ({ ...f, num_inference_steps: val[0] }))}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          More steps = higher quality but slower generation (10-50)
        </p>
      </div>

      {/* Prompt Adherence */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            Prompt Adherence: {form.guidance_scale}
          </label>
        </div>
        <Slider
          defaultValue={[form.guidance_scale ?? 3]}
          min={1}
          max={20}
          step={0.5}
          onValueChange={(val) => setForm(f => ({ ...f, guidance_scale: val[0] }))}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          How strictly the AI follows your text prompt (1 = flexible, 20 =
          strict)
        </p>
      </div>

      {/* Number of Images */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Number of Images</label>
          <span className="text-sm font-medium text-foreground">{form.num_images}</span>
        </div>
        <Slider
          value={[form.num_images ?? 1]}
          min={1}
          max={4}
          step={1}
          onValueChange={(val) => setForm((f) => ({ ...f, num_images: val[0] }))}
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Generate multiple variations to choose from (uses more credits)
        </p>
      </div>

      {/* Safety Filter */}
      <div className="space-y-2">
        <div className="space-y-1 py-2">
          <label className="text-sm font-medium">Content Type</label>
          <div className="flex gap-4">
            <Button variant={form.enable_safety_checker ? "default" : "outline"} className="flex-1" onClick={() => setForm(f => ({ ...f, enable_safety_checker: true }))}>
              SFW
            </Button>
            <Button variant={!form.enable_safety_checker ? "default" : "outline"} className="flex-1" onClick={() => setForm(f => ({ ...f, enable_safety_checker: false }))}>
              NSFW
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Filters potentially unsafe content (recommended to keep enabled)
        </p>
      </div>
    </div >
  );
}
