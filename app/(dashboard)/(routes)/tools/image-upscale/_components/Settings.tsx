"use client";

import { Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateForm } from "@/lib/utils";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import VideoUpload, { VideoUploadHandle } from "@/components/video-upload";
import { ClarityUpscalerInput, UpscaleModel } from "@/types/upscale";

type Props = {
  form: ClarityUpscalerInput;
  setForm: React.Dispatch<React.SetStateAction<ClarityUpscalerInput>>;
  imageUploadRef: Record<string, React.RefObject<ImageUploadHandle | VideoUploadHandle | null>>;
};

export default function Settings({ form, setForm, imageUploadRef }: Props) {
  const { image_url, video_url } = imageUploadRef;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Upscale Model</label>
        <Select
          value={form.model}
          onValueChange={(value) =>
            updateForm(setForm, {
              model: value as UpscaleModel,
              referenceImage: undefined,
              referenceVideo: undefined,
              image_url: "",
              video_url: undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UpscaleModel.TopazImage}>Topaz Image Upscale (Starter)</SelectItem>
            <SelectItem value={UpscaleModel.SeedVrImage}>SeedVR Image Upscale</SelectItem>
            <SelectItem value={UpscaleModel.BytedanceVideo}>Bytedance Video Upscale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.model === UpscaleModel.BytedanceVideo ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Reference Video</label>
          <VideoUpload
            fieldName="referenceVideo"
            ref={video_url as React.RefObject<VideoUploadHandle>}
            data={{ referenceVideo: form.referenceVideo }}
            update={(data) => updateForm(setForm, data)}
            maxFiles={1}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Reference Image</label>
          <ImageUpload
            fieldName="referenceImage"
            ref={image_url as React.RefObject<ImageUploadHandle>}
            data={{ referenceImage: form.referenceImage }}
            update={(data) => updateForm(setForm, data)}
          />
        </div>
      )}

      {form.model === UpscaleModel.BytedanceVideo ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Target Resolution</label>
            <Select
              value={form.target_resolution ?? "1080p"}
              onValueChange={(value) => updateForm(setForm, { target_resolution: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1080p">1080p</SelectItem>
                <SelectItem value="2k">2K</SelectItem>
                <SelectItem value="4k">4K</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Target FPS</label>
            <Select
              value={form.target_fps ?? "30fps"}
              onValueChange={(value) => updateForm(setForm, { target_fps: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30fps">30 FPS</SelectItem>
                <SelectItem value="60fps">60 FPS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            60 FPS and higher resolutions cost more credits.
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Additional Settings</label>
              <p className="text-xs text-muted-foreground">Customize your input with more control.</p>
            </div>
          </div>

          <details className="rounded-lg border border-border/60 bg-card/50 p-3" open>
            <summary className="cursor-pointer text-sm font-medium text-foreground">More</summary>

            <div className="mt-3 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Upscale Factor</label>
                  <span className="text-sm font-medium">{form.upscale_factor}x</span>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[form.upscale_factor]}
                    min={1}
                    max={10}
                    step={0.1}
                    onValueChange={(val) => setForm((f) => ({ ...f, upscale_factor: val[0] }))}
                  />
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">1x</span>
                    <span className="text-xs text-muted-foreground">10x</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Resolution</label>
                <Select
                  value={form.target_resolution ?? "auto"}
                  onValueChange={(value) =>
                    updateForm(setForm, {
                      target_resolution: value === "auto" ? undefined : (value as any),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="1440p">1440p</SelectItem>
                    <SelectItem value="2160p">2160p (4K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </details>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            SeedVR uses reference image + optional additional settings only.
          </p>
        </div>
      )}
    </div>
  );
}
