import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { File } from "buffer";
import { makeUrlFriendlyFilename } from "@/lib/utils";
import { uploadBufferToS3 } from "@/lib/storage/s3";

// Configure route to handle large file uploads (up to 100MB)
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

// NOTE (2026-05-25): this route previously instantiated its OWN
// S3Client with no `endpoint` set. That works for AWS S3 but HANGS on
// Cloudflare R2 — with AWS_REGION=auto + R2 creds, the SDK builds a
// bogus s3.auto.amazonaws.com endpoint and the PutObject blocks until
// the 300s timeout (the "Uploading files…" spinner-of-death). It also
// built an AWS-style public URL that R2 doesn't serve. Both are fixed
// by delegating to lib/storage/s3.ts#uploadBufferToS3, which already
// handles the R2 endpoint (AWS_S3_ENDPOINT) + public URL base
// (AWS_S3_PUBLIC_URL_BASE). One S3 config for the whole app, no drift.

export async function POST(req: Request) {
  try {
    console.log("[DEBUG] Upload API called");

    const formData = await req.formData();
    const mode = process.env.UPLOAD_MODE || "local";
    console.log("[DEBUG] Upload mode:", mode);

    // Extract validation config from formData
    const maxFilesRaw = formData.get("maxFiles");
    const maxFiles = Number(maxFilesRaw || 10);
    console.log("[DEBUG] Max files allowed:", maxFiles);

    const allowedTypesRaw = formData.get("allowedTypes");
    const allowedTypes = allowedTypesRaw
      ? JSON.parse(allowedTypesRaw as string)
      : [];
    console.log("[DEBUG] Allowed types:", allowedTypes);

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`[DEBUG] File found: key=${key}, name=${value.name}, type=${value.type}, size=${value.size}`);
        files.push(value);
      }
    }

    console.log(`[DEBUG] Total files received: ${files.length}`);

    // Validate file count
    if (files.length > maxFiles) {
      console.warn(`[WARN] Exceeded max file limit: ${files.length} > ${maxFiles}`);
      return NextResponse.json(
        { error: `Exceeded max file limit: ${maxFiles}` },
        { status: 400 }
      );
    }

    const uploadedFiles: {
      name: string;
      url: string;
      type: "local" | "s3";
    }[] = [];

    for (const file of files) {
      console.log(`[DEBUG] Processing file: ${file.name} of type ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Check file size (100MB limit per file)
      const maxFileSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxFileSize) {
        console.warn(`[WARN] File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return NextResponse.json(
          { error: `File "${file.name}" is too large. Maximum size is 100MB.` },
          { status: 400 }
        );
      }

      if (
        allowedTypes.length > 0 &&
        !allowedTypes.includes(file.type)
      ) {
        console.warn(`[WARN] File type not allowed: ${file.type}`);
        return NextResponse.json(
          { error: `File type ${file.type} not allowed for file "${file.name}"` },
          { status: 400 }
        );
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueName = makeUrlFriendlyFilename(file);
        console.log(`[DEBUG] Generated unique filename: ${uniqueName}`);

        if (mode === "s3") {
          const key = `uploads/${uniqueName}`;
          console.log(`[DEBUG] Uploading to S3/R2, key: ${key}`);

          // Delegates to the shared helper → correct R2 endpoint +
          // public URL. Returns the durable, publicly-fetchable URL.
          const url = await uploadBufferToS3(buffer, key, file.type);
          console.log(`[DEBUG] Uploaded to S3/R2, URL: ${url}`);

          uploadedFiles.push({
            name: file.name,
            url,
            type: "s3",
          });
        } else {
          const uploadDir = join(process.cwd(), "public", "uploads");
          console.log(`[DEBUG] Uploading locally to directory: ${uploadDir}`);

          await mkdir(uploadDir, { recursive: true });

          const filePath = join(uploadDir, uniqueName);
          await writeFile(filePath, buffer);
          console.log(`[DEBUG] File written locally: ${filePath}`);

          uploadedFiles.push({
            name: file.name,
            url: `/uploads/${uniqueName}`,
            type: "local",
          });
        }
      } catch (fileError: any) {
        console.error(`[ERROR] Failed to process file ${file.name}:`, fileError);
        return NextResponse.json(
          { error: `Failed to process file "${file.name}": ${fileError.message || "Unknown error"}` },
          { status: 500 }
        );
      }
    }

    console.log("[DEBUG] All files processed, returning response");

    return NextResponse.json({
      message: "Upload successful",
      files: uploadedFiles,
    });
  } catch (err: any) {
    console.error("[UPLOAD_ERROR]", err);
    const errorMessage = err?.message || "Upload failed";
    const errorDetails = err?.stack ? `\nDetails: ${err.stack}` : "";
    console.error("[UPLOAD_ERROR_DETAILS]", errorDetails);
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
