// lib/webhook/update-job-status.ts
import { ToolType } from "@prisma/client";
import { chargeUserForTool, UsageTable } from "../charge-user";
import { Image } from "@/types/image";
import { NormalizedError } from "../normalize-fal-error";

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
}) {
  const modelName = params.model._meta?.name || params.model?.name
  const mapping = modelToUsageTable[modelName];

  if (!mapping) throw new Error(`No mapping found for model: ${modelName}`);

  const { usageTable, urlField } = mapping;

  if (params.urlValue) {
    const updateData: Record<string, any> = {
      [urlField]: params.urlValue,
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
