import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getFalJobResult } from "@/lib/fal-client";
import { UpscaleModel } from "@/types/upscale";

function extractUpscaleUrl(payload: any): string | null {
  return (
    payload?.image?.url ||
    payload?.image_url ||
    payload?.video?.url ||
    payload?.video_url ||
    payload?.payload?.image?.url ||
    payload?.payload?.video?.url ||
    payload?.data?.image?.url ||
    payload?.data?.video?.url ||
    payload?.output?.image?.url ||
    payload?.output?.video?.url ||
    null
  );
}

interface Params {
  jobId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await auth();
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
    }

    const upscaleJob = await prismadb.upscaled.findFirst({
      where: {
        id: jobId,
        userId: user.userId,
      },
      select: {
        status: true,
        upscaledImage: true,
        reason: true,
      },
    });

    if (!upscaleJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if ((upscaleJob.status === "queued" || upscaleJob.status === "processing") && !upscaleJob.upscaledImage) {
      const model = (upscaleJob.reason as any)?.model as UpscaleModel | undefined;
      const endpoint = model === UpscaleModel.BytedanceVideo ? UpscaleModel.BytedanceVideo : UpscaleModel.SeedVrImage;
      try {
        const result: any = await getFalJobResult(endpoint, jobId);
        const outputUrl = extractUpscaleUrl(result);
        if (outputUrl) {
          await prismadb.upscaled.update({
            where: { id: jobId },
            data: { status: "completed", upscaledImage: outputUrl },
          });
          return NextResponse.json({ status: "completed", imageUrl: outputUrl }, { status: 200 });
        }
      } catch {}
    }

    return NextResponse.json(
      { status: upscaleJob.status, imageUrl: upscaleJob.upscaledImage },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch upscale job status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
