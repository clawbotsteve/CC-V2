// lib/webhook/update-job-status.ts
import { ToolType } from "@prisma/client";
import { chargeUserForTool, UsageTable } from "../charge-user";
import { Image } from "@/types/image";
import { NormalizedError } from "../normalize-fal-error";
import { isS3Configured, mirrorUrlToS3 } from "../storage/s3";

/**
 * Best-effort: persist an ephemeral provider URL (replicate.delivery
 * auto-expires in ~1–24h) onto our own S3 so the asset stays usable
 * forever. No-op until S3 is configured (UPLOAD_MODE/S3 env), and
 * NEVER blocks job completion — on any failure we fall back to the
 * original URL so the user still gets their result.
 */
async function persistUrl(
  sourceUrl: string,
  usageTable: string,
  requestId: string,
): Promise<string> {
  if (!isS3Configured()) return sourceUrl;
  if (!/^https?:\/\//i.test(sourceUrl)) return sourceUrl;
  try {
    const m = sourceUrl.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
    const ext = (m?.[1] || "bin").toLowerCase();
    return await mirrorUrlToS3(
      sourceUrl,
      `generations/${usageTable}/${requestId}`,
      `asset.${ext}`,
    );
  } catch (err) {
    console.error(
      `[update-job-status] S3 mirror failed for ${requestId}, keeping ephemeral URL:`,
      (err as Error)?.message || err,
    );
    return sourceUrl;
  }
}

// Use exact UsageTable literals here
const modelToUsageTable: Record<
  string,
  { usageTable: UsageTable; urlField: string }
> = {
  GeneratedImage: { usageTable: "GeneratedImage", urlField: "imageUrl" },
  GeneratedVideo: { usageTable: "GeneratedVideo", urlField: "videoUrl" },
  ImageEdit: { usageTable: "ImageEdit", urlField: "editedUrl" },
  FaceEnhance: { usageTable: "FaceEnhance", urlField: "editedUrl" },
  FaceSwap: { usageTable: "FaceSwap", urlField: "swapedUrl" },
  Upscaled: { usageTable: "Upscaled", urlField: "upscaledImage" },
  ImageAnalysis: { usageTable: "ImageAnalysis", urlField: "description" },
};

export async function updateJobStatus(params: {
  model: any;
  requestId: string;
  userId: string;
  urlValue?: string;
  imagesArray?: Image[];
  toolType: ToolType;
  reason?: NormalizedError[];
  /**
   * Credit-cost variant from the job record (e.g. "gpt_image_2_medium",
   * "nano_banana_2_1k"). Required for the cost lookup in chargeUserForTool —
   * without it, the lookup falls through to whichever ToolCreditCost row
   * comes back first, which is wrong (and silently undeducts on tools
   * that have multiple variants).
   */
  variant?: string;
}) {
  const modelName = params.model._meta?.name || params.model?.name
  const mapping = modelToUsageTable[modelName];

  if (!mapping) throw new Error(`No mapping found for model: ${modelName}`);

  const { usageTable, urlField } = mapping;

  if (params.urlValue) {
    // Mirror the ephemeral provider URL to durable storage so the
    // user's asset doesn't 404 in a day. Best-effort; falls back to
    // the original URL on any failure.
    const durableUrl = await persistUrl(
      params.urlValue,
      usageTable,
      params.requestId,
    );

    const updateData: Record<string, any> = {
      [urlField]: durableUrl,
      status: "completed",
      generationTime: new Date(),
    };

    //* Only GeneratedImage has `images`
    if (modelName === "GeneratedImage" && params.imagesArray?.length) {
      updateData.images = params.imagesArray;
    }

    //* Add reason if any
    if(params.reason?.length) {
      updateData.reason = params.reason
    }

    await params.model.update({
      where: { id: params.requestId },
      data: updateData,
    });

    await chargeUserForTool({
      userId: params.userId,
      tool: params.toolType,
      variant: params.variant,
      usageId: params.requestId,
      usageTable,
    });

    return "completed";
  } else {
    await params.model.update({
      where: { id: params.requestId },
      data: {
        reason: params.reason,
        status: "failed"
      },
    });
    return "failed";
  }
}
