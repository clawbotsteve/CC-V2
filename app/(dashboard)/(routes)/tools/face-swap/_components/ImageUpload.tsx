"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { Form } from "@/components/ui/form";

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  required?: boolean;
}

export interface ImageUploadHandle {
  upload: () => Promise<string[]>;
  getFiles: () => File[];
  reset: () => void;
}

const ImageUpload = React.forwardRef<ImageUploadHandle, Props>(
  (
    {
      files,
      onFilesChange,
      disabled = false,
      maxFiles = 1,
      maxSizeMB = 5,
      accept = "image/*",
      required = true,
    },
    ref
  ) => {
    const form = useForm();
    const [uploading, setUploading] = React.useState(false);

    React.useImperativeHandle(ref, () => ({
      async upload() {
        if (files.length === 0) {
          if (required) {
            toast.error("No file selected", {
              description: "Please upload at least one file.",
            });
            throw new Error("No file selected");
          } else {
            return []; // ✅ Skip upload if not required and empty
          }
        }

        setUploading(true);

        try {
          const result = await uploadFiles({
            files,
            maxFiles,
            allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          });

          if ("error" in result) {
            toast.error(result.error);
            throw new Error(result.error);
          }

          if (!result.files || result.files.length === 0) {
            toast.error("Upload failed: no files returned.");
            throw new Error("No files returned from upload");
          }

          const urls = result.files.map((f) => f.url);
          return urls;
        } catch (error) {
          throw error;
        } finally {
          setUploading(false);
        }
      },

      getFiles() {
        return files;
      },

      reset() {
        onFilesChange([]);
      },
    }));

    const onFileReject = (file: File, message: string) => {
      toast.error(message, {
        description: `"${
          file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
        }" has been rejected`,
      });
    };

    return (
      <Form {...form}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FileUpload
            value={files}
            onValueChange={onFilesChange}
            accept={accept}
            maxFiles={maxFiles}
            maxSize={maxSizeMB * 1024 * 1024}
            onFileReject={onFileReject}
            className="w-full max-w-md"
            disabled={disabled || uploading}
          >
            {files.length <= 0 ? (
              <FileUploadDropzone>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center justify-center rounded-full border p-2.5">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm">Drag & drop files here</p>
                  <p className="text-muted-foreground text-xs">
                    Or click to browse (max {maxFiles} files, {maxSizeMB}MB
                    each)
                  </p>
                </div>
                <FileUploadTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-fit"
                    disabled={disabled || uploading}
                  >
                    Browse files
                  </Button>
                </FileUploadTrigger>
              </FileUploadDropzone>
            ) : (
              <FileUploadList orientation="horizontal">
                {files.map((file, index) => (
                  <FileUploadItem key={index} value={file} className="p-0">
                    <FileUploadItemPreview className="size-full [&>svg]:size-12">
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
                          onFilesChange(files.filter((_, i) => i !== index))
                        }
                        disabled={disabled || uploading}
                      >
                        <X className="size-3" />
                      </Button>
                    </FileUploadItemDelete>
                  </FileUploadItem>
                ))}
              </FileUploadList>
            )}
          </FileUpload>
        </form>
      </Form>
    );
  }
);

ImageUpload.displayName = "ImageUpload";
export default ImageUpload;
