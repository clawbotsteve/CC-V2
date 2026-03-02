"use client";

import { updateForm } from "@/lib/utils";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { FaceSwapInput } from "@/types/swap";
import { UserGender, WorkflowType } from "@/types/types";
import { Info } from "lucide-react";

type Props = {
  form: FaceSwapInput;
  setForm: React.Dispatch<React.SetStateAction<FaceSwapInput>>;
  imageUploadRef: Record<string, React.RefObject<ImageUploadHandle | null>>;
};

export default function Settings({ form, setForm, imageUploadRef }: Props) {
  const { face_image0, face_image1, target_image } = imageUploadRef;

  return (
    <div className="space-y-8">
      {/* 1st User Face + Gender */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">1st Person Face</label>
        <ImageUpload
          fieldName="referenceImage"
          ref={face_image0}
          data={{ referenceImage: form.referenceImage?.[0] }}
          update={(data) => updateForm(setForm, data)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">1st Person Gender</label>
        <div className="flex gap-2 mt-2">
          {[UserGender.Male, UserGender.Female].map((g) => (
            <Button
              key={g}
              type="button"
              size="sm"
              variant={form.gender0 === g ? "default" : "outline"}
              onClick={() => setForm(f => ({ ...f, gender0: g }))}
            >
              {g}
            </Button>
          ))}
        </div>
      </div>

      {/* 2nd User Face + Gender */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">2nd Person Face</label>
        <ImageUpload
          fieldName="referenceImage"
          ref={face_image1}
          data={{ referenceImage: form.referenceImage?.[1] }}
          update={(data) => updateForm(setForm, data)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">2nd Person Gender</label>
        <div className="flex gap-2 mt-2">
          {[UserGender.Male, UserGender.Female].map((g) => (
            <Button
              key={g}
              type="button"
              size="sm"
              variant={form.gender1 === g ? "default" : "outline"}
              onClick={() => setForm(f => ({ ...f, gender1: g }))}
            >
              {g}
            </Button>
          ))}
        </div>
      </div>

      {/* Target image */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Target Person Face</label>
        <ImageUpload
          fieldName="referenceImage"
          ref={target_image}
          data={{ referenceImage: form.referenceImage?.[2] }}
          update={(data) => updateForm(setForm, data)}
        />
      </div>

      {/* Workflow Type */}
      <div className="space-y-2">
        <h4>Workflow Type</h4>
        <div className="flex gap-2">
          {[WorkflowType.UserHair, WorkflowType.TargetHair].map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={form.workflow_type === type ? "default" : "outline"}
              onClick={() => setForm(f => ({ ...f, workflow_type: type }))}
            >
              {type
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Button>
          ))}
        </div>
      </div>

      {/* Upscale & Detailer */}
      <div className="space-y-2">
        <h4>Options</h4>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={form.upscale ? "default" : "outline"}
            onClick={() => setForm(f => ({ ...f, upscale: !form.upscale }))}
          >
            Enable Upscale 2x
          </Button>
          <Button
            type="button"
            size="sm"
            variant={form.detailer ? "default" : "outline"}
            onClick={() => setForm(f => ({ ...f, detailer: !form.detailer }))}
          >
            Use Detailer
          </Button>
        </div>
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
    </div >
  );
}
