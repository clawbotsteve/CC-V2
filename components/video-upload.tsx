"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
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
import { Clapperboard, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/utils";

interface Props {
  data: Record<string, File | File[] | undefined>;
  fieldName: string; // key to update in parent form
  update: (data: Record<string, File | File[] | undefined>) => void;
  maxFiles?: number; // dynamic maxFiles
}

export interface VideoUploadHandle {
  upload: () => Promise<string[]>;
  getFiles: () => File[];
  reset: () => void;
  setFilesFromUrls: (urls: string[]) => Promise<void>;
}

const VideoUpload = React.forwardRef<VideoUploadHandle, Props>(
  ({ data, fieldName, update, maxFiles = 1 }, ref) => {
    const form = useForm();
    const [uploading, setUploading] = React.useState(false);
    
    const [files, setFiles] = React.useState<File[]>(() => {
      const fieldData = data?.[fieldName];
      return Array.isArray(fieldData)
        ? fieldData
        : fieldData
          ? [fieldData]
          : [];
    });

    // Track uploaded URLs to avoid re-uploading
    const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);

    const accept = "video/*";
    const NS = "[VideoUpload]";

    const applyFieldUpdate = (
      files: File[],
      maxFiles: number
    ) => {
      const newValue =
        maxFiles === 1 ? files[0] ?? undefined : files;

      update({ [fieldName]: newValue });
    };


    const urlToFile = async (url: string, filename?: string): Promise<File | null> => {
      try {
        const response = await fetch(url);

        // Check if the response is successful (status 200-299)
        if (!response.ok) {
          console.error(`${NS} Failed to fetch video: ${response.status} ${response.statusText}`);
          return null;
        }

        const blob = await response.blob();

        // Validate that the response is actually a video
        if (!blob.type.startsWith('video/')) {
          console.error(`${NS} URL did not return a video. Content-Type: ${blob.type}`);
          return null;
        }
        
        // Extract filename from URL if not provided
        const urlFilename = filename || url.split('/').pop() || 'video.mp4';
        
        return new File([blob], urlFilename, { type: blob.type });
      } catch (error) {
        console.error(`${NS} Error converting URL to file:`, error);
        return null;
      }
    };

    React.useImperativeHandle(ref, () => ({
      async upload(): Promise<string[]> {
        console.log(`${NS} upload() called`);

        if (!files.length) {
          return [];
        }

        // Check if files are already uploaded
        if (uploadedUrls.length === files.length) {
          console.log(`${NS} Files already uploaded, returning existing URLs`);
          return uploadedUrls;
        }

        setUploading(true);
        try {
          const result = await uploadFiles({
            files,
            maxFiles,
            allowedTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
          });
          
          if ("error" in result) {
            throw new Error(result.error);
          }

          const urls = result.files.map((f) => f.url);
          setUploadedUrls(urls);
          return urls;
        } catch (error: any) {
          console.error(`${NS} Upload failed:`, error);
          toast.error(error?.message || "Video upload failed");
          throw error;
        } finally {
          setUploading(false);
        }
      },
      getFiles(): File[] {
        return files;
      },
      reset(): void {
        setFiles([]);
        setUploadedUrls([]);
        applyFieldUpdate([], maxFiles);
      },
      async setFilesFromUrls(urls: string[]): Promise<void> {
        if (!urls.length) return;
        
        const filePromises = urls.map((url) => urlToFile(url));
        const loadedFiles = (await Promise.all(filePromises)).filter(
          (f): f is File => f !== null
        );
        
        if (loadedFiles.length) {
          setFiles(loadedFiles);
          setUploadedUrls(urls);
          applyFieldUpdate(loadedFiles, maxFiles);
        }
      },
    }));

    return (
      <Form {...form}>
        <FormItem>
          <FileUpload
            value={files}
            onValueChange={(newFiles) => {
              setFiles(newFiles);
              applyFieldUpdate(newFiles, maxFiles);
              setUploadedUrls([]); // Reset uploaded URLs when files change
            }}
            maxFiles={maxFiles}
            accept={accept}
            disabled={uploading}
          >
            <FileUploadDropzone>
              <FileUploadTrigger asChild>
                <Button type="button" variant="outline" disabled={uploading}>
                  <Clapperboard className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Video"}
                </Button>
              </FileUploadTrigger>
              <p className="text-xs text-muted-foreground mt-2">
                Drag and drop a video file here, or click to browse
              </p>
            </FileUploadDropzone>
            <FileUploadList>
              {files.map((file, index) => (
                <FileUploadItem key={`${file.name}-${index}`} value={file}>
                  <FileUploadItemPreview>
                    <PlayCircle className="h-8 w-8 text-primary/80" />
                  </FileUploadItemPreview>
                  <FileUploadItemMetadata>
                    <FileUploadItemDelete />
                  </FileUploadItemMetadata>
                  <FileUploadItemProgress />
                </FileUploadItem>
              ))}
            </FileUploadList>
          </FileUpload>
          <FormMessage />
        </FormItem>
      </Form>
    );
  }
);

VideoUpload.displayName = "VideoUpload";

export default VideoUpload;
