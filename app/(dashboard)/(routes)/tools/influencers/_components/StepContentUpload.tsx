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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ImageIcon, X, XCircle } from "lucide-react";
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
  /** Three-way consent state captured by the likeness-consent modal. */
  getConsent: () => {
    self: boolean;
    adult: boolean;
    misuse: boolean;
    accepted: boolean;
    acceptedAt: string | null;
  };
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
    const [agreementOpen, setAgreementOpen] = React.useState(false);
    // Three-way per-job consent (replaces the single agreementChecked).
    // All three must be ticked before we'll let the user upload, and the
    // composite truth is exposed on `hasAcceptedAgreement` + sent with
    // the training submission for server-side audit.
    const [consentSelf, setConsentSelf] = React.useState(false);
    const [consentAdult, setConsentAdult] = React.useState(false);
    const [consentMisuse, setConsentMisuse] = React.useState(false);
    const [hasAcceptedAgreement, setHasAcceptedAgreement] = React.useState(false);
    const [consentAcceptedAt, setConsentAcceptedAt] = React.useState<string | null>(null);
    const browseButtonRef = React.useRef<HTMLButtonElement>(null);

    const accept = "image/*";
    const maxFileSize = 10 * 1024 * 1024; // 10 MB

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
        setHasAcceptedAgreement(false);
        setConsentSelf(false);
        setConsentAdult(false);
        setConsentMisuse(false);
        setConsentAcceptedAt(null);
      },

      getConsent() {
        return {
          self: consentSelf,
          adult: consentAdult,
          misuse: consentMisuse,
          accepted: hasAcceptedAgreement,
          acceptedAt: consentAcceptedAt,
        };
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

    const handleBrowseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hasAcceptedAgreement) return;
      e.preventDefault();
      e.stopPropagation();
      setAgreementOpen(true);
    };

    const handleAgreementContinue = () => {
      // Defense-in-depth: even though the button is disabled until all
      // three are checked, double-check before flipping accept state so
      // a programmatic click can't bypass.
      if (!consentSelf || !consentAdult || !consentMisuse) return;
      const acceptedAtIso = new Date().toISOString();
      setHasAcceptedAgreement(true);
      setConsentAcceptedAt(acceptedAtIso);
      setAgreementOpen(false);

      // Re-trigger browse after acceptance so user can continue seamlessly.
      requestAnimationFrame(() => {
        browseButtonRef.current?.click();
      });
    };

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
                      Or click to browse (max 15 files, 10MB each)
                    </p>
                  </div>
                  <FileUploadTrigger asChild>
                    <Button
                      ref={browseButtonRef}
                      variant="outline"
                      size="sm"
                      className="mt-2 w-fit"
                      disabled={uploading}
                      onClick={handleBrowseClick}
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

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Do
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Upload 10–20+ photos of one person</li>
                    <li>• Use clear face shots from multiple angles</li>
                    <li>• Include varied lighting/backgrounds/outfits</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-400">
                    <XCircle className="h-4 w-4" /> Don’t
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Mix multiple people in one dataset</li>
                    <li>• Upload duplicates, heavy filters, or blurry shots</li>
                    <li>• Use photos with covered faces (masks/sunglasses)</li>
                  </ul>
                </div>
              </div>
            </FormItem>
          </form>
        </Form>

        {/*
          Likeness consent gate (revised 2026-05-02). Replaced the previous
          generic 4-bullet copy with three specific affirmations that match
          what we record on the Influencer row + what the AUP requires.
          Each must be ticked individually — no single "I agree to all"
          escape — so users can't auto-pilot through.
        */}
        <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Likeness Consent — required to train</DialogTitle>
              <DialogDescription>
                Avatar training creates a model that can reproduce a real person&apos;s
                likeness. Confirm all three before uploading photos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 text-sm">
              <label className="flex items-start gap-2.5 rounded-md border border-border p-3 cursor-pointer hover:border-foreground/30">
                <input
                  type="checkbox"
                  checked={consentSelf}
                  onChange={(e) => setConsentSelf(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">The person depicted is me</span>, OR I have
                  explicit written consent from the person depicted in these images.
                </span>
              </label>

              <label className="flex items-start gap-2.5 rounded-md border border-border p-3 cursor-pointer hover:border-foreground/30">
                <input
                  type="checkbox"
                  checked={consentAdult}
                  onChange={(e) => setConsentAdult(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  The person depicted is <span className="font-medium">at least 18 years old</span>.
                </span>
              </label>

              <label className="flex items-start gap-2.5 rounded-md border border-border p-3 cursor-pointer hover:border-foreground/30">
                <input
                  type="checkbox"
                  checked={consentMisuse}
                  onChange={(e) => setConsentMisuse(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I will not use this trained model to{" "}
                  <span className="font-medium">harass, deceive, impersonate, or generate sexual content</span>.
                </span>
              </label>

              <p className="text-[11px] text-muted-foreground pt-1">
                Your acceptance is logged with this training job and may be reviewed by
                TaviraLabs in response to abuse reports.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setAgreementOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAgreementContinue}
                disabled={!consentSelf || !consentAdult || !consentMisuse}
              >
                Continue to Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
