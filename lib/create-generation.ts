import { ImageUploadHandle } from "@/components/image-upload";
import { toast } from "sonner";

/**
 * Optional callbacks that can be executed after generation.
 */
export interface CreateGenerationOptions {
  closeSettings?: () => void;
  refetch?: () => void;
}

/**
 * Represents the result returned after a generation request.
 */
export type GenerationResult<Options extends Record<string, any>> = Options & {
  id: string;
  userId: string;
  status: "queued";
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Parameters for the `createGeneration` function.
 */
export interface CreateGenerationParams<Options extends Record<string, any>, Payload = any> {
  /** Current options/configuration object for the generation. Can contain any fields. */
  options: Options;

  /** Function to update or reset the options state. */
  setOptions: (val: Options) => void;

  /** Default values for resetting the options state after submission. */
  defaultOptions: Options;

  /** ID of the current user submitting the generation. */
  userId: string;

  /** URL of the API endpoint where the generation request should be submitted. */
  apiEndpoint: string;

  /** Function that converts the options object into a payload suitable for the API. */
  buildPayload: (options: Options) => Payload;

  /** Optional reference object for handling file uploads. Should contain `upload` and `reset` methods. */
  // uploadRef?: {
  //   current?: {
  //     upload?: () => Promise<string[]>; // returns array of URLs
  //     reset?: () => void;
  //   } | null;
  // };
  uploadRefs?: Record<string, React.RefObject<{ upload?: () => Promise<string[]>; getFiles?: () => File[]; reset?: () => void; setFilesFromUrls?: (urls: string[]) => Promise<void> } | null>>;

  /** Optional callbacks to run after generation is successfully submitted. */
  callbacks?: CreateGenerationOptions;
}

/**
 * Handles submitting a generation request to an API endpoint, including optional file uploads,
 * resetting state, and executing callbacks after success.
 */
export const createGeneration = async <
  Options extends Record<string, any>,
  Payload = any
>({
  options,
  setOptions,
  defaultOptions,
  userId,
  apiEndpoint,
  buildPayload,
  uploadRefs,
  callbacks,
}: CreateGenerationParams<Options, Payload>): Promise<GenerationResult<Options> | null> => {
  try {
    if ("prompt" in options && typeof options.prompt === "string" && !options.prompt.trim()) {
      toast.error("Please enter a prompt");
      return null;
    }

    const updatedOptions = { ...options };

    if (uploadRefs && Object.keys(uploadRefs).length > 0) {
      toast.loading("Uploading files...");

      const uploadTasks = Object.entries(uploadRefs).map(async ([field, ref]) => {
        if (ref?.current?.upload) {
          const uploaded = await ref.current.upload();
          const uploadedUrls = Array.isArray(uploaded) ? uploaded : [uploaded];
          const uploadedUrl = uploadedUrls[0];
          return { field, url: uploadedUrl, urls: uploadedUrls };
        }
        return null;
      });

      const results = await Promise.all(uploadTasks);

      results.forEach((res) => {
        if (res?.url) {
          (updatedOptions as any)[res.field] = res.url;
        }
        if (res?.urls && res.urls.length > 0) {
          (updatedOptions as any)[`${res.field}s`] = res.urls;
        }
      });

      toast.dismiss();
    }

    toast.loading("Submitting generation...");
    const payload = buildPayload(updatedOptions);

    const normalizedPayload = { ...payload } as any;

    // Hard guard for Nano Banana models: ensure selected aspect ratio is always submitted.
    if (
      normalizedPayload?.model === "fal-ai/nano-banana-2" ||
      normalizedPayload?.model === "fal-ai/nano-banana-2/edit"
    ) {
      const fromSize =
        normalizedPayload.image_size === "square" || normalizedPayload.image_size === "square_hd"
          ? "1:1"
          : normalizedPayload.image_size === "portrait_16_9"
            ? "9:16"
            : normalizedPayload.image_size === "landscape_16_9"
              ? "16:9"
              : normalizedPayload.image_size === "portrait_4_3"
                ? "3:4"
                : normalizedPayload.image_size === "landscape_4_3"
                  ? "4:3"
                  : undefined;

      // Prefer image_size-derived aspect first (more reliable from UI control state), then fallback to aspect_ratio.
      const normalizedAspect = fromSize || normalizedPayload.aspect_ratio;
      if (!normalizedAspect) {
        throw new Error("Please select an aspect ratio before generating.");
      }
      normalizedPayload.aspect_ratio = normalizedAspect;
      normalizedPayload.image_size =
        normalizedAspect === "1:1"
          ? "square"
          : normalizedAspect === "9:16"
            ? "portrait_16_9"
            : normalizedAspect === "16:9"
              ? "landscape_16_9"
              : normalizedAspect === "3:4"
                ? "portrait_4_3"
                : normalizedAspect === "4:3"
                  ? "landscape_4_3"
                  : normalizedPayload.image_size;

      if (process.env.NODE_ENV === "development") {
        console.log("[CREATE_GENERATION][NANO] submitting", {
          aspect_ratio: normalizedPayload.aspect_ratio,
          image_size: normalizedPayload.image_size,
          output_resolution: normalizedPayload.output_resolution,
        });
      }
    }

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedPayload),
    });
    toast.dismiss();

    let responseData: any = null;
    const rawText = await res.text();
    try {
      responseData = rawText ? JSON.parse(rawText) : null;
    } catch {
      responseData = { error: rawText };
    }

    if (!res.ok) throw new Error(responseData?.error || "Generation submission failed");

    const { jobId } = responseData;

    const newGeneration: GenerationResult<Options> = {
      id: jobId,
      userId,
      status: "queued",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...updatedOptions,
    };



    //* Reset
    if (uploadRefs) {
      Object.values(uploadRefs).forEach((ref) => {
        ref?.current?.reset?.();
      });
    }

    setOptions(defaultOptions);
    callbacks?.closeSettings?.();
    callbacks?.refetch?.();



    toast.success("Generation started!");
    return newGeneration;



  } catch (err: any) {
    toast.error(err?.message || "Something went wrong");
    return null;
  }
};
