import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { getFalJobResult, getFalJobStatus } from "@/lib/fal-client";
import { ImageGenerationModel } from "@/types/image";

const FAL_ENDPOINTS = [
  ImageGenerationModel.NanoBanana2,
  ImageGenerationModel.NanoBannaPro,
  // Kontext removed
  ImageGenerationModel.V1,
  ImageGenerationModel.Lora,
] as const;

const HIGGS_BASE = (process.env.HIGGSFIELD_BASE_URL || "https://platform.higgsfield.ai").replace(/\/$/, "");

function extractImageUrl(data: any): string | undefined {
  return (
    data?.imageUrl ||
    data?.image_url ||
    data?.payload?.imageUrl ||
    data?.payload?.image_url ||
    data?.images?.[0]?.url ||
    data?.images?.[0]?.image_url ||
    data?.payload?.images?.[0]?.url ||
    data?.payload?.images?.[0]?.image_url ||
    data?.output?.images?.[0]?.url ||
    data?.output?.images?.[0]?.image_url ||
    data?.output?.image?.url ||
    data?.data?.images?.[0]?.url ||
    data?.result?.images?.[0]?.url
  );
}

async function pollFalDirect(jobId: string) {
  for (const endpoint of FAL_ENDPOINTS) {
    try {
      const resultData: any = await getFalJobResult(endpoint, jobId);
      const imageUrl = extractImageUrl(resultData);
      if (imageUrl) return { status: "completed", imageUrl, reason: undefined };
    } catch {
      // continue
    }

    try {
      const statusData: any = await getFalJobStatus(endpoint, jobId);
      const status = String(
        statusData?.status ?? statusData?.request_status ?? statusData?.state ?? statusData?.payload?.status ?? ""
      ).toUpperCase();

      if (!status || ["IN_QUEUE", "IN_PROGRESS", "QUEUED", "PROCESSING", "PENDING"].includes(status)) {
        continue;
      }

      if (["COMPLETED", "OK", "DONE", "SUCCESS"].includes(status)) {
        const resultData: any = await getFalJobResult(endpoint, jobId);
        const imageUrl = extractImageUrl(resultData);
        return { status: "completed", imageUrl, reason: undefined };
      }

      if (["FAILED", "ERROR", "CANCELLED"].includes(status)) {
        return { status: "failed", reason: statusData?.error || statusData?.reason || { message: "Provider job failed" } };
      }
    } catch {
      // continue
    }
  }

  return { status: "processing" };
}

async function pollHiggsDirect(jobId: string) {
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  if (!apiKey) return { status: "processing" as const };

  const paths = [`/requests/${jobId}/status`, `/v1/requests/${jobId}/status`];
  for (const path of paths) {
    try {
      const res = await fetch(`${HIGGS_BASE}${path}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data: any = await res.json().catch(() => ({}));

      const rawStatus = data?.status ?? data?.request_status ?? data?.state ?? data?.data?.status ?? "";
      const status = String(rawStatus).toUpperCase();
      const imageUrl = extractImageUrl(data);

      if (imageUrl) return { status: "completed", imageUrl, reason: undefined };
      if (["COMPLETED", "OK", "DONE", "SUCCESS"].includes(status)) {
        return { status: "completed", imageUrl, reason: undefined };
      }
      if (["FAILED", "ERROR", "CANCELLED"].includes(status)) {
        return { status: "failed", reason: data?.error || data?.reason || { message: "Soul 2.0 job failed" } };
      }
    } catch {
      // continue
    }
  }

  return { status: "processing" as const };
}

async function pollProvider(jobId: string) {
  const fal = await pollFalDirect(jobId);
  if (fal.status !== "processing") return fal;
  return pollHiggsDirect(jobId);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;

  try {
    const imageJob = await prismadb.generatedImage.findFirst({
      where: { id: jobId, userId },
      select: { id: true, status: true, imageUrl: true, reason: true },
    });

    if (!imageJob) {
      const provider = await pollProvider(jobId);
      return NextResponse.json(provider, { status: 200 });
    }

    if (imageJob.status === "queued" || imageJob.status === "processing" || !imageJob.imageUrl) {
      const provider: any = await pollProvider(jobId);
      if (provider.status === "completed" || provider.status === "failed") {
        try {
          await prismadb.generatedImage.update({
            where: { id: jobId },
            data: {
              status: provider.status,
              imageUrl: provider.imageUrl ?? imageJob.imageUrl,
              reason: provider.reason ?? imageJob.reason,
            },
          });
        } catch (persistErr) {
          console.warn("[IMAGE STATUS] Could not persist provider status to DB:", persistErr);
        }
        return NextResponse.json(provider, { status: 200 });
      }
    }

    return NextResponse.json({ status: imageJob.status, imageUrl: imageJob.imageUrl, reason: imageJob.reason }, { status: 200 });
  } catch (error) {
    console.warn("[IMAGE STATUS] DB unavailable, trying provider polling:", error);
    const provider = await pollProvider(jobId);
    return NextResponse.json(provider, { status: 200 });
  }
}
