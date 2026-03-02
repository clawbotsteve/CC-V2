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
import { FileSizeErrorModal } from "@/components/ui/file-size-error-modal";

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

const StepContentUpload = React.forwardRef<StepContentUploadHandle, Props>(
  ({ data, update }, ref) => {
    const form = useForm();
    const [uploading, setUploading] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>(data?.trainingPhoto ?? []);
    const [errorModalOpen, setErrorModalOpen] = React.useState(false);
    const [errorModalData, setErrorModalData] = React.useState<{
      error: string;
      fileName?: string;
      fileSize?: number;
      maxSize?: number;
    }>({
      error: "",
    });

    const accept = "image/*";
    const maxFileSize = 5 * 1024 * 1024; // 5 MB

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

          const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
          const zipFile = new File([blob], `${crypto.randomUUID()}.zip`, {
            type: "application/zip",
          });

          const zipSizeMB = (zipFile.size / 1024 / 1024).toFixed(2);
          console.log(`[DEBUG] ZIP file created: ${zipSizeMB}MB (${files.length} files)`);

          // Check if ZIP is too large (100MB limit)
          if (zipFile.size > 100 * 1024 * 1024) {
            const errorMsg = `ZIP file is too large (${zipSizeMB}MB). Maximum size is 100MB. Please reduce the number of images or their size.`;
            setErrorModalData({
              error: errorMsg,
              fileName: `Training Data Archive (${files.length} files)`,
              fileSize: zipFile.size,
              maxSize: 100 * 1024 * 1024,
            });
            setErrorModalOpen(true);
            throw new Error(errorMsg);
          }

          toast.dismiss();

          // Step 2: Upload ZIP
          toast.loading(`Uploading training data (${zipSizeMB}MB)...`);
          const zipUploadRes = await uploadFiles({
            files: [zipFile],
            maxFiles: 1,
            allowedTypes: ["application/zip"],
          });

          toast.dismiss();

          if ("error" in zipUploadRes) {
            const errorMsg = zipUploadRes.error;
            // Check if it's a file size error
            if (errorMsg.toLowerCase().includes("too large") || errorMsg.toLowerCase().includes("size")) {
              setErrorModalData({
                error: errorMsg,
                fileName: `Training Data Archive (${files.length} files)`,
                fileSize: zipFile.size,
                maxSize: 100 * 1024 * 1024,
              });
              setErrorModalOpen(true);
            }
            throw new Error(`Failed to upload training data: ${errorMsg}`);
          }

          if (!zipUploadRes.files?.length) {
            throw new Error("Failed to upload training data: No file returned from server.");
          }

          const trainingDataUrl = zipUploadRes.files[0].url;
          console.log(`[DEBUG] Training data uploaded: ${trainingDataUrl}`);

          // Step 3: Upload first image separately
          toast.loading("Uploading first image...");
          const firstImageRes = await uploadFiles({
            files: [files[0]],
            maxFiles: 1,
            allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          });

          toast.dismiss();

          if ("error" in firstImageRes) {
            const errorMsg = firstImageRes.error;
            // Check if it's a file size error
            if (errorMsg.toLowerCase().includes("too large") || errorMsg.toLowerCase().includes("size")) {
              setErrorModalData({
                error: errorMsg,
                fileName: files[0].name,
                fileSize: files[0].size,
                maxSize: maxFileSize,
              });
              setErrorModalOpen(true);
            }
            throw new Error(`Failed to upload first image: ${errorMsg}`);
          }

          if (!firstImageRes.files?.length) {
            throw new Error("Failed to upload first image: No file returned from server.");
          }

          const firstImageUrl = firstImageRes.files[0].url;
          console.log(`[DEBUG] First image uploaded: ${firstImageUrl}`);

          // ✅ Return both
          return {
            trainingDataUrl,
            firstImageUrl,
          };
        } catch (error: any) {
          console.error("[ERROR] Upload error:", error);
          const errorMessage = error?.message || "Upload failed. Please try again.";
          toast.error(errorMessage, {
            description: error?.details || "If the problem persists, try uploading fewer images or reduce their file size.",
            duration: 5000,
          });
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
      
      // Show custom modal for file size errors
      if (message.toLowerCase().includes("too large") || message.toLowerCase().includes("file too large")) {
        setErrorModalData({
          error: message,
          fileName: file.name,
          fileSize: file.size,
          maxSize: maxFileSize,
        });
        setErrorModalOpen(true);
      } else {
        // Show toast for other rejection reasons
        toast.error(message, {
          description: `"${
            file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
          }" has been rejected`,
        });
      }
    };

    React.useEffect(() => {
      console.log("[DEBUG] Files changed", files);
      if (update) update({ trainingPhoto: files });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    return (
      <>
        <Form {...form}>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <FormItem>
              <FormLabel>Upload Training Photos</FormLabel>

              <FileUpload
                value={files}
                onValueChange={setFiles}
                accept={accept}
                maxFiles={15}
                maxSize={maxFileSize}
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
                      <FileUploadItemPreview className="size-24 [&>svg]:size-20">
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

        {/* File Size Error Modal */}
        <FileSizeErrorModal
          open={errorModalOpen}
          onOpenChange={setErrorModalOpen}
          error={errorModalData.error}
          fileName={errorModalData.fileName}
          fileSize={errorModalData.fileSize}
          maxSize={errorModalData.maxSize}
        />
      </>
    );
  }
);

StepContentUpload.displayName = "StepContentUpload";
export default StepContentUpload;
