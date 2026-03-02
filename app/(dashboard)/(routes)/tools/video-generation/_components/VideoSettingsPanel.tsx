import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VideoAspectRatio, VideoGenerationForm, getVideoVariant } from "@/types/video";
import ImageUpload, { ImageUploadHandle } from "@/components/image-upload";
import VideoUpload, { VideoUploadHandle } from "@/components/video-upload";
import { VideoModel, Duration } from "@/types/types";
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
          const newVariant = getVideoVariant(newModel, form.duration);
          // Kling/Kling Motion Control/Veo enforce safety (SFW only)
          // Bytedance supports NSFW
          const enable_safety_checker = newModel === VideoModel.Kling || newModel === VideoModel.KlingMotionControl || newModel === VideoModel.Veo;
          const generate_audio = newModel === VideoModel.Kling ? (form.generate_audio ?? true) : false;
          const keep_original_sound = newModel === VideoModel.KlingMotionControl ? (form.keep_original_sound ?? true) : form.keep_original_sound;
          updateForm(setForm, { model: newModel, variant: newVariant, enable_safety_checker, generate_audio, keep_original_sound });
        }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VideoModel.Kling}>
              <div className="flex items-center justify-between w-full">
                Kling 2.6
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-4 font-medium border border-primary/30">
                  SFW
                </span>
              </div>
            </SelectItem>
            <SelectItem value={VideoModel.KlingMotionControl}>
              <div className="flex items-center justify-between w-full">
                Kling Motion Control
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-4 font-medium border border-primary/30">
                  SFW
                </span>
              </div>
            </SelectItem>
            <SelectItem value={VideoModel.Bytedance}>
              <div className="flex items-center justify-between w-full">
                Bytedance
                <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full ml-4 font-medium border border-destructive/30">
                  NSFW
                </span>
              </div>
            </SelectItem>
            <SelectItem value={VideoModel.Veo}>
              <div className="flex items-center justify-between w-full">
                <span>Veo 3.1</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium border border-border">
                    Image-to-Video
                  </span>
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/30">
                    SFW
                  </span>
                </div>
              </div>
            </SelectItem>
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

      {/* Duration (hidden for Kling Motion Control) */}
      {form.model !== VideoModel.KlingMotionControl && (
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
