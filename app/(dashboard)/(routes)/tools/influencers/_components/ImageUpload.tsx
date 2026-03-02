"use client";

import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export interface ImageUploadHandle {
  upload: () => Promise<string>; // Returns uploaded image URL
  getFile: () => File | null;
  reset: () => void;
}

export const ImageUpload = React.forwardRef<ImageUploadHandle, {}>(
  (props, ref) => {
    const [files, setFiles] = React.useState<File[]>([]);
    // const [progressMap, setProgressMap] = React.useState<
    //   Record<string, number>
    // >({});
    const [uploading, setUploading] = React.useState(false);

    React.useImperativeHandle(ref, () => ({
      async upload() {
        const file = files[0];
        if (!file) {
          toast.error("No image selected", {
            className:
              "bg-indigo-500 text-white font-semibold rounded-md shadow-md px-4 py-2",
            description: "Please upload an image before proceeding.",
          });
          throw new Error("No image selected");
        }

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        setUploading(false);

        if (!res.ok) {
          toast.error("Image upload failed", {
            className:
              "bg-red-600 text-white font-semibold rounded-md shadow-lg",
            description: "Please try again or check your connection.",
          });
          throw new Error("Image upload failed");
        }

        const { url } = await res.json();
        return url as string;
      },
      getFile() {
        return files[0] ?? null;
      },
      reset: () => setFiles([]),
    }));

    const onFileReject = (file: File, message: string) => {
      toast(message, {
        description: `"${
          file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
        }" has been rejected`,
        className:
          "bg-red-600 text-white px-4 py-2 rounded-md shadow-lg font-semibold",
        descriptionClassName: "text-sm opacity-90",
      });
    };

    return (
      <FileUpload
        value={files}
        onValueChange={setFiles}
        accept="image/*"
        maxFiles={15}
        maxSize={5 * 1024 * 1024}
        onFileReject={onFileReject}
        className="w-full max-w-md"
        multiple
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center justify-center rounded-full border p-2.5">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-sm">Drag & drop files here</p>
            <p className="text-muted-foreground text-xs">
              Or click to browse (max 1 file, 5MB)
            </p>
          </div>
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2 w-fit">
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
                >
                  <X className="size-3" />
                </Button>
              </FileUploadItemDelete>
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
    );
  }
);

ImageUpload.displayName = "ImageUpload";
