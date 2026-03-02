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

interface Props {
  data: {
    trainingPhoto: File[];
  };
  update: (data: Partial<Props["data"]>) => void;
}

export interface SwapImageUploadHandle {
  upload: () => Promise<string[]>;
  getFiles: () => File[];
  reset: () => void;
}

const SwapImage = React.forwardRef<SwapImageUploadHandle, Props>(
  ({ data, update }, ref) => {
    const form = useForm();
    const [uploading, setUploading] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>(data?.trainingPhoto ?? []);

    const accept = "image/*";

    React.useImperativeHandle(ref, () => ({
      async upload() {
        console.log("[DEBUG] SwapImage.upload() called");
        if (files.length === 0) {
          toast.error("No file selected", {
            description: "Please upload at least one file.",
          });
          console.warn("[WARN] Upload aborted: No files selected");
          throw new Error("No file selected");
        }

        setUploading(true);
        console.log("[DEBUG] Uploading started");

        try {
          const result = await uploadFiles({
            files,
            maxFiles: 15,
            allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          });

          console.log("[DEBUG] uploadFiles result:", result);

          if ("error" in result) {
            toast.error(result.error);
            console.error("[ERROR] uploadFiles error:", result.error);
            throw new Error(result.error);
          }

          if (!result.files || result.files.length === 0) {
            toast.error("Upload failed: no files returned.");
            console.error("[ERROR] uploadFiles returned no files");
            throw new Error("No files returned from upload");
          }

          const urls = result.files.map((f) => f.url);
          console.log("[DEBUG] Upload successful, urls:", urls);

          return urls;
        } catch (error) {
          console.error("[ERROR] uploadFiles threw error:", error);
          throw error;
        } finally {
          setUploading(false);
          console.log("[DEBUG] Uploading ended");
        }
      },

      getFiles() {
        console.log("[DEBUG] SwapImage.getFiles called", files);
        return files;
      },

      reset() {
        console.log("[DEBUG] SwapImage.reset called");
        setFiles([]);
      },
    }));

    const onFileReject = (file: File, message: string) => {
      console.warn(`[WARN] File rejected: ${file.name} - ${message}`);
      toast.error(message, {
        description: `"${
          file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
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
              maxFiles={1}
              maxSize={5 * 1024 * 1024} // 5 MB
              onFileReject={onFileReject}
              className="w-full max-w-md"
              disabled={uploading}
            >
              <FileUploadDropzone>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center justify-center rounded-full border p-2.5">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm">Drag & drop files here</p>
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

              <FileUploadList orientation="horizontal">
                {files.map((file, index) => (
                  <FileUploadItem key={index} value={file} className="p-0">
                    <FileUploadItemPreview className="size-16 [&>svg]:size-12">
                      {uploading && (
                        <FileUploadItemProgress variant="circular" size={40} />
                      )}
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
                ))}
              </FileUploadList>
            </FileUpload>

            <FormMessage />
          </FormItem>
        </form>
      </Form>
    );
  }
);

SwapImage.displayName = "SwapImage";
export default SwapImage;
