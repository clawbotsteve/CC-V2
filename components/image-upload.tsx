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
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/utils";

interface Props {
  data: Record<string, File | File[] | undefined>;
  fieldName: string; // key to update in parent form
  update: (data: Record<string, File | File[] | undefined>) => void;
  maxFiles?: number; // dynamic maxFiles
}

export interface ImageUploadHandle {
  upload: () => Promise<string[]>;
  getFiles: () => File[];
  reset: () => void;
  setFilesFromUrls: (urls: string[]) => Promise<void>;
}

const ImageUpload = React.forwardRef<ImageUploadHandle, Props>(
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

    const accept = "image/*";
    const NS = "[ImageUpload]";

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
          console.error(`${NS} Failed to fetch image: ${response.status} ${response.statusText}`);
          return null;
        }

        const blob = await response.blob();

        // Validate that the response is actually an image
        if (!blob.type.startsWith('image/')) {
          console.error(`${NS} URL did not return an image. Content-Type: ${blob.type}`);
          return null;
        }
        
        // Extract filename from URL if not provided
        const urlFilename = filename || url.split('/').pop() || 'image.jpg';
        
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
          // console.info(`${NS} No files selected`);
          return [];
        }

        // Check if we already have uploaded URLs for these files
        if (uploadedUrls.length > 0 && uploadedUrls.length === files.length) {
          console.log(`${NS} Returning cached URLs (already uploaded):`, uploadedUrls);
          return uploadedUrls;
        }

        setUploading(true);
        try {
          const result = await uploadFiles({
            files,
            maxFiles,
            allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          });

          if ("error" in result) {
            // result is UploadError here
            toast.error(result.error);
            console.error(`${NS} Upload error:`, result.error);
            throw new Error(result.error);
          }

          if (!result.files || result.files.length === 0) {
            const errMsg = "No files returned from upload";
            toast.error(errMsg);
            console.error(`${NS} ${errMsg}`);
            throw new Error(errMsg);
          }

          const urls = result.files.map(f => f.url);
          // console.log(`${NS} Upload successful:`, urls);

          // Cache the uploaded URLs
          setUploadedUrls(urls);

          return urls;
        } catch (error) {
          console.error(`${NS} upload() threw error:`, error);
          throw error;
        } finally {
          setUploading(false);
        }
      },

      getFiles() {
        // console.log(`${NS} getFiles() called`);
        return files;
      },

      reset() {
        // console.log(`${NS} reset() called`);
        setFiles([]);
        setUploadedUrls([]);
      },

      async setFilesFromUrls(urls: string[]): Promise<void> {
        
        if (!urls || urls.length === 0) {
          setFiles([]);
          setUploadedUrls([]);
          return;
        }

        const loadingToast = toast.loading('Loading image...');
        
        try {
          const filePromises = urls.slice(0, maxFiles).map((url, index) =>
            urlToFile(url, `image-${index}.jpg`)
          );
          
          const convertedFiles = await Promise.all(filePromises);
          const validFiles = convertedFiles.filter((f): f is File => f !== null);
          
          if (validFiles.length === 0) {
            toast.error('Failed to load images');
            return;
          }
          
          setFiles(validFiles);
          setUploadedUrls(urls);
          toast.success(`Loaded ${validFiles.length} image(s)`);
        } catch (error) {
          console.error(`${NS} setFilesFromUrls error:`, error);
          toast.error('Failed to load images');
        } finally {
          toast.dismiss(loadingToast);
        }
      },
    }));

    const onFileReject = (file: File, message: string) => {
      // console.warn(`${NS} File rejected: ${file.name} - ${message}`);
      toast.error(message, {
        description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" rejected`,
      });
    };

    React.useEffect(() => {
      applyFieldUpdate(files, maxFiles);
    }, [files]);

    // Clear cached URLs when files change (user adds/removes files)
    React.useEffect(() => {
      const fileNames = files.map(f => f.name).join(',');
      if (fileNames && uploadedUrls.length > 0) {
        if (files.length !== uploadedUrls.length) {
          setUploadedUrls([]);
        }
      }
    }, [files.length]); // Only watch length to avoid clearing on every file change


    return (
      <Form {...form}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormItem>
            <FileUpload
              value={files}
              onValueChange={setFiles}
              accept={accept}
              maxFiles={maxFiles}
              maxSize={5 * 1024 * 1024} // 5 MB
              onFileReject={onFileReject}
              className="w-full max-w-md"
              disabled={uploading}
            >
              <div className="space-y-4">
                {files.length > 0 && (
                  <div className="space-y-3">
                    <FileUploadList orientation="horizontal" className="gap-4">
                      {files.map((file, index) => (
                        <FileUploadItem key={index} value={file} className="p-0 relative w-24 h-24 sm:w-32 sm:h-32">
                          <FileUploadItemPreview className="size-full rounded-lg overflow-hidden border [&>svg]:size-12">
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
                  </div>
                )}
                {files.length < maxFiles && (
                  <FileUploadDropzone>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="flex items-center justify-center rounded-full border p-2.5">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium text-sm">
                        {files.length === 0 ? "Drag & drop files here" : "Add more images"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Or click to browse ({files.length}/{maxFiles}) - 5MB each. Must be bigger than 300x300px
                      </p>
                    </div>
                    <FileUploadTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-fit"
                        disabled={uploading}
                      >
                        {files.length === 0 ? "Browse files" : "Add More"}
                      </Button>
                    </FileUploadTrigger>
                  </FileUploadDropzone>
                )}
              </div>
            </FileUpload>

            <FormMessage />
          </FormItem>
        </form>
      </Form>
    );
  }
);

ImageUpload.displayName = "ImageUpload";
export default ImageUpload;
