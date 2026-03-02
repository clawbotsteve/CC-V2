"use client";

import { Info, Image } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { updateForm } from "@/lib/utils";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import { FaceEnhanceInput } from "@/types/enhance";
import { OutputFormat } from "@/types/types";

type Props = {
  form: FaceEnhanceInput;
  setForm: React.Dispatch<React.SetStateAction<FaceEnhanceInput>>;
  imageUploadRef: Record<string, React.RefObject<ImageUploadHandle | null>>;
};

export default function Settings({ form, setForm, imageUploadRef }: Props) {
  const ASPECT_RATIOS = [
    { label: "1:1", desc: "Square", value: "1:1" },
    { label: "4:5", desc: "Portrait", value: "4:5" },
    { label: "3:4", desc: "Classic", value: "3:4" },
    { label: "9:16", desc: "Story", value: "9:16" },
    { label: "16:9", desc: "Wide", value: "16:9" },
  ];

  const { image } = imageUploadRef

  return (
    <div className="space-y-8">
      {/* Image Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Reference Image</label>
        <ImageUpload
          fieldName="referenceImage"
          ref={image}
          data={{ referenceImage: form.referenceImage }}
          update={(data) => updateForm(setForm, data)}
        />
      </div>

      {/* Aspect Ratios */}
      <div className="space-y-2 py-2">
        <label className="text-xs font-medium">Aspect Ratio</label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map(({ label, desc, value }) => (
            <button
              key={label}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  aspect_ratio: value as
                    | "1:1"
                    | "4:3"
                    | "16:9"
                    | "4:3"
                    | "16:9",
                }))
              }
              className={`flex flex-col items-center justify-center border rounded-xl p-2 text-xs
                          ${form.aspect_ratio === value ? "border-primary bg-muted" : "border-border bg-background"}`}
            >
              <Image className="w-4 h-4 mb-1 text-muted-foreground" />
              <span className="font-semibold">{label}</span>
              <span className="text-[10px] text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Adherence */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            Guidance Scale: {form.guidance_scale}
          </label>
        </div>
        <Slider
          defaultValue={[form.guidance_scale]}
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

      {/* Inference Steps */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            Inference Steps: {form.num_inference_step}
          </label>
        </div>
        <Slider
          defaultValue={[form.num_inference_step]}
          min={10}
          max={50}
          step={1}
          onValueChange={(val) => setForm(f => ({ ...f, num_inference_step: val[0] }))}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          More steps = higher quality but slower generation (10-50)
        </p>
      </div>

      {/* Output Format */}
      <div className="space-y-2 py-2">
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
