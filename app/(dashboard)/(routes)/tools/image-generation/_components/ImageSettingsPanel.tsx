"use client";

import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ImageGenerationInput, ImageGenerationModel, NanoBananaResolution } from "@/types/image";
import { aspectToImageSize, imageSizeToAspect } from "@/lib/aspect-ratio";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AspectRatio, ImageSize, InfluencerWithOwner, OutputFormat } from "@/types/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateForm } from "@/lib/utils";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import { OptimizePromptButton } from "@/components/optimize-prompt-button";

type Props = {
  form: ImageGenerationInput;
  setForm: React.Dispatch<React.SetStateAction<ImageGenerationInput>>;
  trainedModels: InfluencerWithOwner[];
  imageUploadRef: Record<string, React.RefObject<ImageUploadHandle | null>>;
};

export default function ImageSettingsPanel({ form, setForm, trainedModels, imageUploadRef }: Props) {
  const ASPECT_RATIO = [
    { label: "1:1", desc: "Square", value: AspectRatio.Ratio1_1 },
    { label: "2:3", desc: "Portrait", value: AspectRatio.Ratio2_3 },
    { label: "3:2", desc: "Photography", value: AspectRatio.Ratio3_2 },
    { label: "3:4", desc: "Classic Portrait", value: AspectRatio.Ratio3_4 },
    { label: "4:3", desc: "Classic Landscape", value: AspectRatio.Ratio4_3 },
    { label: "9:16", desc: "Story", value: AspectRatio.Ratio9_16 },
    { label: "9:21", desc: "Ultra Tall", value: AspectRatio.Ratio9_21 },
    { label: "16:9", desc: "Wide", value: AspectRatio.Ratio16_9 },
    { label: "21:9", desc: "Ultra Wide", value: AspectRatio.Ratio21_9 },
  ];

  const aspectToImageSizeMap: Partial<Record<AspectRatio, ImageSize>> = {
    [AspectRatio.Ratio1_1]: ImageSize.Square,
    [AspectRatio.Ratio3_4]: ImageSize.Portrait4_3,
    [AspectRatio.Ratio9_16]: ImageSize.Portrait16_9,
    [AspectRatio.Ratio4_3]: ImageSize.Landscape4_3,
    [AspectRatio.Ratio16_9]: ImageSize.Landscape16_9,
  };

  const imageSizeToAspectMap: Partial<Record<ImageSize, AspectRatio>> = {
    [ImageSize.SquareHD]: AspectRatio.Ratio1_1,
    [ImageSize.Square]: AspectRatio.Ratio1_1,
    [ImageSize.Portrait4_3]: AspectRatio.Ratio3_4,
    [ImageSize.Portrait16_9]: AspectRatio.Ratio9_16,
    [ImageSize.Landscape4_3]: AspectRatio.Ratio4_3,
    [ImageSize.Landscape16_9]: AspectRatio.Ratio16_9,
  };

  const { image_url } = imageUploadRef
  
  // Determine model type and capabilities
  const isNanoBannaPro = form.model === ImageGenerationModel.NanoBannaPro;
  const isLora = form.model === ImageGenerationModel.Lora;
  const isV1 = form.model === ImageGenerationModel.V1;
  const isNanoBanana2 = form.model === ImageGenerationModel.NanoBanana2;
  const isNanoBanana2Base = form.model === ImageGenerationModel.NanoBanana2Base;

  // Image-to-image models require a reference image
  const isImageToImage = isNanoBanana2;
  const isTextToImage = isV1 || isLora;
  const isNanoModel = isNanoBanana2 || isNanoBannaPro || isNanoBanana2Base;

  // Plan lock UI remains in dropdown badges/disabled items.
  // Removed runtime auto-switch effect to prevent hook import/runtime mismatches.


  const modelOptions = [
    { value: ImageGenerationModel.NanoBannaPro, label: "Nano Banana Pro", mode: "text", tag: "Text-to-Image" },
    { value: ImageGenerationModel.NanoBanana2Base, label: "Nano Banana 2", mode: "text", tag: "Text-to-Image" },
    { value: ImageGenerationModel.NanoBanana2, label: "Nano Banana 2 Edit", mode: "image", tag: "Image-to-Image" },
    { value: ImageGenerationModel.Lora, label: "Flux LoRA", mode: "text", tag: "Text-to-Image" },
    { value: ImageGenerationModel.V1, label: "Flux Pro V1", mode: "text", tag: "Text-to-Image" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Unified model selector (text-to-image + image-to-image together) */}
      <div className="space-y-1 py-2">
        <label className="text-sm font-medium text-foreground">Model</label>
        <Select
          value={form.model}
          onValueChange={(value) => {
            const newModel = value as ImageGenerationModel;
            if (newModel === ImageGenerationModel.NanoBannaPro) {
              setForm((f) => {
                const nextAspect = (f.aspect_ratio ?? imageSizeToAspect(f.image_size as any) ?? "1:1") as any;
                return {
                  ...f,
                  model: newModel,
                  lora_id: "none",
                  aspect_ratio: nextAspect,
                  image_size: aspectToImageSize(nextAspect) as any,
                  referenceImage: undefined,
                  image_url: undefined,
                };
              });
            } else if (newModel === ImageGenerationModel.NanoBanana2Base) {
              setForm((f) => {
                const nextAspect = (f.aspect_ratio ?? imageSizeToAspect(f.image_size as any) ?? "1:1") as any;
                return {
                  ...f,
                  model: newModel,
                  lora_id: "none",
                  aspect_ratio: nextAspect,
                  image_size: aspectToImageSize(nextAspect) as any,
                  referenceImage: undefined,
                  image_url: undefined,
                };
              });
            } else if (newModel === ImageGenerationModel.Lora) {
              setForm((f) => ({ ...f, model: newModel, referenceImage: undefined }));
            } else if (newModel === ImageGenerationModel.V1) {
              setForm((f) => ({ ...f, model: newModel, lora_id: "none", referenceImage: undefined }));
            } else if (newModel === ImageGenerationModel.Soul2) {
              setForm((f) => ({ ...f, model: newModel, lora_id: "none", referenceImage: undefined }));
            } else if (newModel === ImageGenerationModel.NanoBanana2) {
              setForm((f) => {
                const nextAspect = (f.aspect_ratio ?? imageSizeToAspect(f.image_size as any) ?? "1:1") as any;
                return {
                  ...f,
                  model: newModel,
                  lora_id: "none",
                  aspect_ratio: nextAspect,
                  image_size: aspectToImageSize(nextAspect) as any,
                  referenceImage: undefined,
                  output_resolution: "1k",
                };
              });
            } else {
              setForm((f) => ({ ...f, model: newModel }));
            }
          }}
        >
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span>{m.label}</span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium border border-border">
                    {m.tag}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" /> Choose any model — mode is handled automatically
        </p>
      </div>

      {/* Trained LoRA Selector - only show for LoRA model */}
      {isLora && (
        <div className="space-y-1 py-2">
          <label className="text-sm font-medium text-foreground">Trained LoRA</label>
        <Select
          value={form.lora_id}
          onValueChange={(value) =>
            setForm((f) => ({ ...f, lora_id: value }))
          }
        >
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {trainedModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {model.name}
                    {model.triggerWord ? ` – ${model.triggerWord}` : ""}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {model.owner}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" /> Select a custom trained model
          </p>
        </div>
      )}

      {/* Reference Image Upload - show for image-to-image models + Nano Banana 2 multi-image input */}
      {(isImageToImage || isNanoBanana2) && (
        <div className="space-y-1 py-2">
          <label className="text-sm font-medium text-foreground">
            {isNanoBanana2
              ? "Input Photos (optional, up to 5)"
              : `Reference Image ${isNanoBannaPro ? "(required)" : "(optional)"}`}
          </label>
          <ImageUpload
            fieldName="referenceImage"
            ref={image_url}
            data={{ referenceImage: form.referenceImage }}
            update={(data) => updateForm(setForm, data)}
            maxFiles={isNanoBanana2 ? 5 : 1}
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" /> {isNanoBanana2 ? "Upload up to 5 photos to guide Nano Banana 2." : "Upload an image to transform or edit"}
          </p>
        </div>
      )}

      {/* Prompt */}
      <div className="space-y-1 py-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-foreground">Prompt</label>
        </div>
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

      {/* Aspect ratio for Nano models: always write BOTH aspect_ratio + image_size */}
      {isNanoModel && (
        <div className="space-y-1 py-2">
          <label className="text-sm font-medium">Aspect ratio</label>
          <Select
            value={((form.aspect_ratio as AspectRatio) || imageSizeToAspectMap[form.image_size as ImageSize] || AspectRatio.Ratio1_1) as string}
            onValueChange={(value) => {
              const nextAspect = value as AspectRatio;
              const nextSize = aspectToImageSizeMap[nextAspect] ?? ImageSize.Square;
              setForm((f) => ({
                ...f,
                aspect_ratio: nextAspect,
                image_size: nextSize,
              }));
            }}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="1:1" />
            </SelectTrigger>
            <SelectContent className="w-[170px] border-white/10 bg-[#1b1b1f] p-1.5">
              {[AspectRatio.Ratio1_1, AspectRatio.Ratio9_16, AspectRatio.Ratio16_9, AspectRatio.Ratio3_4, AspectRatio.Ratio4_3].map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="rounded-md px-2 py-2 data-[state=checked]:bg-zinc-700/80 focus:bg-zinc-700/80"
                >
                  <div className="flex w-full items-center gap-3">
                    <span className="h-4 w-4 rounded border border-zinc-300/70" />
                    <span className="text-sm">{value}</span>
                    {(form.aspect_ratio === value || imageSizeToAspectMap[form.image_size as ImageSize] === value) && <Check className="ml-auto h-4 w-4" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Aspect ratio for non-Nano image-to-image models */}
      {isImageToImage && !isNanoModel && (
        <div className="space-y-1 py-2">
          <label className="text-sm font-medium">Aspect ratio</label>
          <Select
            value={form.aspect_ratio ?? "auto"}
            onValueChange={(value) =>
              setForm((f) => ({
                ...f,
                aspect_ratio: value === "auto" ? undefined : (value as AspectRatio),
              }))
            }
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="auto" />
            </SelectTrigger>
            <SelectContent className="w-[170px] border-white/10 bg-[#1b1b1f] p-1.5">
              <SelectItem value="auto" className="rounded-md px-2 py-2 data-[state=checked]:bg-zinc-700/80 focus:bg-zinc-700/80">
                <div className="flex w-full items-center gap-3">
                  <span className="h-4 w-4 rounded border border-zinc-300/70" />
                  <span className="text-sm lowercase">auto</span>
                  {(form.aspect_ratio ?? "auto") === "auto" && <Check className="ml-auto h-4 w-4" />}
                </div>
              </SelectItem>
              {ASPECT_RATIO.map(({ label, value }) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="rounded-md px-2 py-2 data-[state=checked]:bg-zinc-700/80 focus:bg-zinc-700/80"
                >
                  <div className="flex w-full items-center gap-3">
                    <span className="h-4 w-4 rounded border border-zinc-300/70" />
                    <span className="text-sm">{label}</span>
                    {form.aspect_ratio === value && <Check className="ml-auto h-4 w-4" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Aspect ratio for text-to-image models */}
      {isTextToImage && (
        <div className="space-y-1 py-2">
          <label className="text-sm font-medium">Aspect ratio</label>
          <Select
            value={((form.image_size && imageSizeToAspectMap[form.image_size as ImageSize]) || "auto") as string}
            onValueChange={(value) =>
              setForm((f) => ({
                ...f,
                image_size: value === "auto" ? undefined : (aspectToImageSizeMap[value as AspectRatio] ?? ImageSize.Portrait16_9),
              }))
            }
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="auto" />
            </SelectTrigger>
            <SelectContent className="w-[170px] border-white/10 bg-[#1b1b1f] p-1.5">
              <SelectItem value="auto" className="rounded-md px-2 py-2 data-[state=checked]:bg-zinc-700/80 focus:bg-zinc-700/80">
                <div className="flex w-full items-center gap-3">
                  <span className="h-4 w-4 rounded border border-zinc-300/70" />
                  <span className="text-sm lowercase">auto</span>
                  {!form.image_size && <Check className="ml-auto h-4 w-4" />}
                </div>
              </SelectItem>
              {ASPECT_RATIO.map(({ label, value }) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="rounded-md px-2 py-2 data-[state=checked]:bg-zinc-700/80 focus:bg-zinc-700/80"
                >
                  <div className="flex w-full items-center gap-3">
                    <span className="h-4 w-4 rounded border border-zinc-300/70" />
                    <span className="text-sm">{label}</span>
                    {imageSizeToAspectMap[form.image_size as ImageSize] === value && <Check className="ml-auto h-4 w-4" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Output Resolution (Nano Banana 2 + Nano Banana 2 Edit) */}
      {(isNanoBanana2 || isNanoBannaPro) && (
        <div className="space-y-1 py-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Output Resolution</label>
            <span className="text-sm font-medium uppercase">{form.output_resolution ?? "1k"}</span>
          </div>
          <div className="flex gap-2">
            {(["1k", "2k", "4k"] as NanoBananaResolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setForm((f) => ({ ...f, output_resolution: res }))}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium border ${
                  (form.output_resolution ?? "1k") === res
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-muted"
                }`}
              >
                {res.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" /> Credits by resolution: 1K = 2, 2K = 3, 4K = 4
          </p>
        </div>
      )}

      {/* Number of Images */}
      <div className="space-y-1 py-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Number of Images</label>
          <span className="text-sm font-medium">{form.num_images}</span>
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
      </div>

      {/* Sliders */}
      {isLora && (
        <>
          {/* Inference Steps */}
          <div className="space-y-1 py-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Inference Steps</label>
              <span className="text-sm font-medium">{form.num_inference_steps}</span>
            </div>
            <Slider
              defaultValue={[form.num_inference_steps!]}
              min={1}
              max={50}
              step={1}
              onValueChange={(val) => setForm(f => ({ ...f, num_inference_steps: val[0] }))}
            />
          </div>
        </>
      )}

      {isLora && (
        <>
          {/* Guidance Scale */}
          <div className="space-y-1 py-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Guidance Scale</label>
              <span className="text-sm font-medium">{form.guidance_scale}</span>
            </div>
            <Slider
              defaultValue={[form.guidance_scale!]}
              min={0}
              max={35}
              step={1}
              onValueChange={(val) => setForm(f => ({ ...f, guidance_scale: val[0] }))}
            />
          </div>
        </>
      )}

      {/* Safety controls removed for simpler phase-1 UI */}

      {/* Output Format */}
      <div className="space-y-1 py-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Output Format</label>
          <span className="text-sm font-medium">{form.output_format}</span>
        </div>
        <div className="flex gap-2">
          {([OutputFormat.Png, OutputFormat.Jpeg] as const).map((format) => (
            <button
              key={format}
              onClick={() => setForm(f => ({ ...f, output_format: format }))}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium border
                ${form.output_format === format
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-muted"}`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>
    </div >
  );
}
