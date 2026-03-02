"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
  FileUploadItemProgress,
} from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/utils";
import JSZip from "jszip";

interface Props {
  data: {
    trainingPhoto: File[];
  };
  update: (data: Partial<Props["data"]>) => void;
}

export interface StepContentUploadHandle {
  upload: () => Promise<{
    trainingDataUrl: string;
    firstImageUrl: string;
  }>;
  getFiles: () => File[];
  reset: () => void;
}

const StepOnboardingUpload = React.forwardRef<StepContentUploadHandle, Props>(
  ({ data, update }, ref) => {
    const form = useForm();
    const [uploading, setUploading] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>(data?.trainingPhoto ?? []);

    const accept = "image/*";

    React.useImperativeHandle(ref, () => ({
      async upload() {
        console.log("[DEBUG] StepContentUpload.upload() called");
        if (files.length === 0) {
          toast.error("No file selected", {
            description: "Please upload at least one file.",
          });
          throw new Error("No file selected");
        }

        setUploading(true);

        try {
          // Step 1: ZIP all images
          toast.loading("Zipping images...");
          const zip = new JSZip();

          files.forEach((file, index) => {
            const extension = file.name.split(".").pop();
            zip.file(`image-${index}.${extension}`, file);
          });

          const blob = await zip.generateAsync({ type: "blob" });
          const zipFile = new File([blob], `${crypto.randomUUID()}.zip`, {
            type: "application/zip",
          });

          toast.dismiss();

          // Step 2: Upload ZIP
          toast.loading("Uploading training data...");
          const zipUploadRes = await uploadFiles({
            files: [zipFile],
            maxFiles: 1,
            allowedTypes: ["application/zip"],
          });

          toast.dismiss();

          if ("error" in zipUploadRes) {
            throw new Error(zipUploadRes.error);
          }

          if (!zipUploadRes.files?.length) {
            throw new Error("Failed to upload zip: No file returned.");
          }

          const trainingDataUrl = zipUploadRes.files[0].url;

          // Step 3: Upload first image separately
          toast.loading("Uploading first image...");
          const firstImageRes = await uploadFiles({
            files: [files[0]],
            maxFiles: 1,
            allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          });

          toast.dismiss();

          if ("error" in firstImageRes) {
            throw new Error(firstImageRes.error);
          }

          if (!firstImageRes.files?.length) {
            throw new Error("Failed to upload first image.");
          }

          const firstImageUrl = firstImageRes.files[0].url;

          // ✅ Return both
          return {
            trainingDataUrl,
            firstImageUrl,
          };
        } catch (error) {
          console.error("[ERROR] Upload error:", error);
          toast.error("Upload failed.");
          throw error;
        } finally {
          setUploading(false);
        }
      },
      getFiles() {
        console.log("[DEBUG] StepContentUpload.getFiles called", files);
        return files;
      },

      reset() {
        console.log("[DEBUG] StepContentUpload.reset called");
        setFiles([]);
      },
    }));

    const onFileReject = (file: File, message: string) => {
      console.warn(`[WARN] File rejected: ${file.name} - ${message}`);
      toast.error(message, {
        description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
          }" has been rejected`,
      });
    };

    React.useEffect(() => {
      console.log("[DEBUG] Files changed", files);
      if (update) update({ trainingPhoto: files });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    return (
      <Form {...form}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormItem>
            <FileUpload
              value={files}
              onValueChange={setFiles}
              accept={accept}
              maxFiles={10}
              maxSize={5 * 1024 * 1024} // 5 MB
              onFileReject={onFileReject}
              className="w-full max-w-full"
              multiple
              disabled={uploading}
            >
              <FileUploadDropzone>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center justify-center rounded-full border p-2.5">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-white/70 font-medium text-sm">Drag & drop files here</p>
                  <p className="text-muted-foreground text-xs">
                    Or click to browse (max 15 files, 5MB each)
                  </p>
                </div>
                <FileUploadTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-fit"
                    disabled={uploading}
                  >
                    Browse files
                  </Button>
                </FileUploadTrigger>
              </FileUploadDropzone>

              <div className="flex flex-wrap overflow-y-auto gap-2">
                {[...Array(10)].map((_, index) => {
                  const file = files[index];

                  if (file) {
                    return (
                      <FileUploadItem key={index} value={file} className="p-0 relative border-0">
                        <FileUploadItemPreview className="size-24 [&>svg]:size-20">
                          {uploading && <FileUploadItemProgress variant="circular" size={40} />}
                        </FileUploadItemPreview>
                        <FileUploadItemMetadata className="sr-only" />
                        <FileUploadItemDelete asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="-top-1 -right-1 absolute size-5 rounded-full"
                            onClick={() =>
                              setFiles((prev) => prev.filter((_, i) => i !== index))
                            }
                            disabled={uploading}
                          >
                            <X className="size-3" />
                          </Button>
                        </FileUploadItemDelete>
                      </FileUploadItem>
                    );
                  } else {
                    return (
                      <FileUploadTrigger asChild>
                        <div
                          key={index}
                          className="size-24 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-600 transition"
                        >
                          <span className="text-3xl select-none">+</span>
                        </div>
                      </FileUploadTrigger>

                    );
                  }
                })}
              </div>

            </FileUpload>

            <FormMessage />
          </FormItem>
        </form>
      </Form>
    );
  }
);

StepOnboardingUpload.displayName = "StepOnboardingUpload";
export default StepOnboardingUpload;
