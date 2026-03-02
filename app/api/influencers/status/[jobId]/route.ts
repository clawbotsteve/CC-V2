import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { getFalJobResult, getFalJobStatus } from "@/lib/fal-client";

const TRAIN_ENDPOINTS = [
  "fal-ai/flux-lora-fast-training",
  "fal-ai/flux-2-trainer",
] as const;

function mapFalStatusToDb(status?: string): "queued" | "processing" | "completed" | "failed" {
  const s = String(status || "").toUpperCase();
  if (s.includes("COMPLETED")) return "completed";
  if (s.includes("FAILED") || s.includes("ERROR")) return "failed";
  if (s.includes("IN_PROGRESS") || s.includes("PROCESSING") || s.includes("RUNNING")) return "processing";
  return "queued";
}

function extractLoraUrl(payload: any): string | null {
  return (
    payload?.diffusers_lora_file?.url ||
    payload?.lora_url ||
    payload?.lora?.url ||
    payload?.output?.diffusers_lora_file?.url ||
    payload?.output?.lora_url ||
    payload?.result?.diffusers_lora_file?.url ||
    payload?.payload?.diffusers_lora_file?.url ||
    null
  );
}

function extractConfigUrl(payload: any): string | null {
  return (
    payload?.config_file?.url ||
    payload?.config_url ||
    payload?.output?.config_file?.url ||
    payload?.result?.config_file?.url ||
    payload?.payload?.config_file?.url ||
    null
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await auth();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
    }

    const influencer = await prismadb.influencer.findFirst({
      where: { id: jobId, userId: user.userId },
      select: { id: true, status: true, loraUrl: true, configUrl: true },
    });

    if (!influencer) {
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }

    // If terminal, return fast.
    if (influencer.status === "completed" || influencer.status === "failed") {
      return NextResponse.json({ status: influencer.status }, { status: 200 });
    }

    // Local dev has no reachable webhook; poll provider as fallback.
    const providerErrors: string[] = [];
    for (const endpoint of TRAIN_ENDPOINTS) {
      try {
        const falStatus: any = await getFalJobStatus(endpoint, jobId);
        const nextStatus = mapFalStatusToDb(falStatus?.status || falStatus?.state);

        if (nextStatus === "completed") {
          let loraUrl: string | null = null;
          let configUrl: string | null = null;
          try {
            const result: any = await getFalJobResult(endpoint, jobId);
            loraUrl = extractLoraUrl(result?.data || result);
            configUrl = extractConfigUrl(result?.data || result);
          } catch (e) {
            console.warn("[INFLUENCER STATUS] result fetch failed after complete", e);
          }

          await prismadb.influencer.update({
            where: { id: jobId },
            data: {
              status: "completed",
              ...(loraUrl ? { loraUrl } : {}),
              ...(configUrl ? { configUrl } : {}),
            },
          });

          return NextResponse.json({ status: "completed" }, { status: 200 });
        }

        if (nextStatus === "failed") {
          await prismadb.influencer.update({ where: { id: jobId }, data: { status: "failed" } });
          return NextResponse.json({ status: "failed" }, { status: 200 });
        }

        if (nextStatus === "processing" && influencer.status !== "processing") {
          await prismadb.influencer.update({ where: { id: jobId }, data: { status: "processing" } });
          return NextResponse.json({ status: "processing" }, { status: 200 });
        }
      } catch (err: any) {
        const msg = err?.body?.detail?.[0]?.msg || err?.message || "Provider status error";
        providerErrors.push(String(msg));
        // Try next endpoint candidate.
      }
    }

    // If provider is clearly rejecting the job payload, fail fast (instead of infinite queued).
    if (providerErrors.some((m) => m.toLowerCase().includes("images_data_url") || m.toLowerCase().includes("validation"))) {
      await prismadb.influencer.update({ where: { id: jobId }, data: { status: "failed" } });
      return NextResponse.json({ status: "failed", error: providerErrors[0] }, { status: 200 });
    }

    return NextResponse.json({ status: influencer.status }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch influencer status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
