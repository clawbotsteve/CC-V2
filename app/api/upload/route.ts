import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { File } from "buffer";
import { makeUrlFriendlyFilename } from "@/lib/utils";

// Configure route to handle large file uploads (up to 100MB)
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
          const bucket = process.env.S3_UPLOAD_BUCKET!;
          const key = `uploads/${uniqueName}`;
          console.log(`[DEBUG] Uploading to S3 bucket: ${bucket}, key: ${key}`);

          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: file.type,
            })
          );

          const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
          console.log(`[DEBUG] Uploaded to S3, URL: ${url}`);

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
