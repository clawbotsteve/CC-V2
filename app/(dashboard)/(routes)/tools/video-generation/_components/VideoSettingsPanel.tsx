import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  VideoAspectRatio,
  VideoGenerationForm,
  getVideoVariant,
  SEEDANCE_DURATION_MIN,
  SEEDANCE_DURATION_MAX,
  SEEDANCE_DEFAULT_DURATION,
  SEEDANCE_DEFAULT_RESOLUTION,
} from "@/types/video";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import VideoUpload, { VideoUploadHandle } from "@/components/video-upload";
import { VideoModel, Duration, SeedanceResolution } from "@/types/types";
import { Info, Video } from "lucide-react";

interface VideoSettingsPanelProps {
  form: VideoGenerationForm;
  setForm: React.Dispatch<React.SetStateAction<VideoGenerationForm>>;
  updateForm: (
    set: React.Dispatch<React.SetStateAction<VideoGenerationForm>>,
    update: Partial<VideoGenerationForm>
  ) => void;
  imageUploadRef: Record<string, React.RefObject<ImageUploadHandle | VideoUploadHandle | null>>;
}

export default function VideoSettingsPanel({
  form,
  setForm,
  updateForm,
  imageUploadRef,
}: VideoSettingsPanelProps) {
  const { image_url } = imageUploadRef

  const ASPECT_RATIO = [
    { label: "9:16", desc: "Portrait", value: VideoAspectRatio.portrait },
    { label: "16:9", desc: "Landscape", value: VideoAspectRatio.landscape },
    { label: "4:3", desc: "HD 4K", value: VideoAspectRatio.hd_4k },
  ];


  return (
    <div className="space-y-4">
      {/* AI Model Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">AI Model</label>
        <Select value={form.model} onValueChange={(value) => {
          const newModel = value as VideoModel;
          // When switching to/from Seedance the duration semantics change
          // (Seedance allows 4-15s; other models are locked to 5/10). Snap
          // duration into a safe range so the user never lands on an
          // invalid combo just from changing the model dropdown.
          const isSwitchingToSeedance = newModel === VideoModel.Seedance2Ref;
          const wasSeedance = form.model === VideoModel.Seedance2Ref;
          let newDuration = form.duration ?? Duration.Five;
          if (isSwitchingToSeedance) {
            // Seedance default is 5s (matches old picker behavior).
            newDuration = SEEDANCE_DEFAULT_DURATION;
          } else if (wasSeedance) {
            // Coming back from Seedance — clamp to the 5/10 the other
            // models support.
            newDuration = newDuration <= 7 ? Duration.Five : Duration.Ten;
          }
          const newVariant = getVideoVariant(newModel, newDuration);
          // All available models enforce safety (platform is SFW-only as of 2026-04-29).
          const enable_safety_checker = true;
          const generate_audio = newModel === VideoModel.Kling ? (form.generate_audio ?? true) : false;
          const keep_original_sound = newModel === VideoModel.KlingMotionControl ? (form.keep_original_sound ?? true) : form.keep_original_sound;
          const seedance_resolution = isSwitchingToSeedance
            ? (form.seedance_resolution ?? SEEDANCE_DEFAULT_RESOLUTION)
            : form.seedance_resolution;
          updateForm(setForm, {
            model: newModel,
            variant: newVariant,
            duration: newDuration,
            enable_safety_checker,
            generate_audio,
            keep_original_sound,
            seedance_resolution,
          });
        }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VideoModel.Kling}>Kling 2.6</SelectItem>
            <SelectItem value={VideoModel.KlingMotionControl}>Kling Motion Control</SelectItem>
            <SelectItem value={VideoModel.Seedance2Ref}>Seedance 2.0 (Reference)</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      {/* Video Upload and Character Orientation for Kling Motion Control */}
      {form.model === VideoModel.KlingMotionControl && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Reference Video</label>
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium border border-destructive/30">
                Required
              </span>
            </div>
            <VideoUpload
              fieldName="referenceVideo"
              ref={imageUploadRef.video_url as React.RefObject<VideoUploadHandle>}
              data={{ referenceVideo: form.referenceVideo }}
              update={(data) => {
                updateForm(setForm, data);
              }}
              maxFiles={1}
            />
          </div>

          {/* Character Orientation */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Character Orientation</label>
            <div className="flex gap-2">
              <Button
                variant={form.character_orientation === "image" ? "default" : "outline"}
                className="flex-1"
                onClick={() => updateForm(setForm, { character_orientation: "image" })}
              >
                Image (Max 10s)
              </Button>
              <Button
                variant={form.character_orientation === "video" ? "default" : "outline"}
                className="flex-1"
                onClick={() => updateForm(setForm, { character_orientation: "video" })}
              >
                Video (Max 30s)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Keep Original Sound</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={form.keep_original_sound === false ? "default" : "outline"}
                className="h-8 px-3"
                onClick={() => updateForm(setForm, { keep_original_sound: false })}
              >
                OFF
              </Button>
              <Button
                type="button"
                variant={form.keep_original_sound !== false ? "default" : "outline"}
                className="h-8 px-3"
                onClick={() => updateForm(setForm, { keep_original_sound: true })}
              >
                ON
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Kling 2.6 audio toggle */}
      {form.model === VideoModel.Kling && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Generate Audio</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={form.generate_audio === false ? "default" : "outline"}
                className="h-8 px-3"
                onClick={() => updateForm(setForm, { generate_audio: false })}
              >
                OFF
              </Button>
              <Button
                type="button"
                variant={form.generate_audio !== false ? "default" : "outline"}
                className="h-8 px-3"
                onClick={() => updateForm(setForm, { generate_audio: true })}
              >
                ON
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" /> Turn audio off for cheaper Kling 2.6 credits.
          </p>
        </div>
      )}

      {/* Prompt */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Prompt</label>
        <Textarea
          placeholder="Describe the video you want to generate..."
          value={form.prompt}
          rows={2}
          onChange={(e) => updateForm(setForm, { prompt: e.target.value })}
          className="min-h-[44px]"
        />
      </div>

      {/* Resolution picker — Seedance 2.0 only.
          480p / 720p / 1080p map to dramatically different FAL costs
          (~$0.13 / $0.30 / $0.68 per second), so this is also the primary
          credit-cost lever for the user. See CREDIT_COSTS.SEEDANCE_V2_REF_*. */}
      {form.model === VideoModel.Seedance2Ref && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {(["480p", "720p", "1080p"] as const).map((res) => (
              <Button
                key={res}
                variant={form.seedance_resolution === res ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  updateForm(setForm, { seedance_resolution: res as SeedanceResolution });
                }}
              >
                {res}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Higher resolution costs more credits per second.
          </p>
        </div>
      )}

      {/* Duration — Seedance gets a 4-15s slider; other models stay on
          5s / 10s buttons. Hidden for Kling Motion Control entirely. */}
      {form.model !== VideoModel.KlingMotionControl && (
        form.model === VideoModel.Seedance2Ref ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Duration</label>
              <span className="text-sm font-medium tabular-nums">
                {form.duration ?? SEEDANCE_DEFAULT_DURATION}s
              </span>
            </div>
            <Slider
              value={[form.duration ?? SEEDANCE_DEFAULT_DURATION]}
              min={SEEDANCE_DURATION_MIN}
              max={SEEDANCE_DURATION_MAX}
              step={1}
              onValueChange={(val) => {
                const newDuration = val[0];
                const newVariant = getVideoVariant(form.model, newDuration);
                updateForm(setForm, { duration: newDuration, variant: newVariant });
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SEEDANCE_DURATION_MIN}s</span>
              <span>{SEEDANCE_DURATION_MAX}s</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Duration</label>
            <div className="flex gap-2">
              {([5, 10] as const).map((d) => (
                <Button
                  key={d}
                  variant={form.duration === d ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    const newDuration = d as Duration;
                    const newVariant = getVideoVariant(form.model, newDuration);
                    updateForm(setForm, { duration: newDuration, variant: newVariant });
                  }}
                >
                  {d}s
                </Button>
              ))}
            </div>
          </div>
        )
      )}


      {/* Aspect ratio */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Video Size</label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIO.map(({ label, desc, value }) => (
            <button
              key={label}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  aspect_ratio: value as VideoAspectRatio
                }))
              }
              className={`flex flex-col items-center justify-center border rounded-xl p-2 text-xs
          ${form.aspect_ratio === value ? "border-primary bg-muted" : "border-border bg-background"}`}
            >
              <Video className="w-4 h-4 mb-1 text-muted-foreground" />
              <span className="font-semibold">{label}</span>
              <span className="text-[10px] text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
