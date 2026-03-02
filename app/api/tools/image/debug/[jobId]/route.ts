import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFalJobResult, getFalJobStatus } from "@/lib/fal-client";
import { ImageGenerationModel } from "@/types/image";

const ENDPOINTS = [
  ImageGenerationModel.NanoBanana2,
  ImageGenerationModel.NanoBannaPro,
  // Kontext removed
  ImageGenerationModel.V1,
  ImageGenerationModel.Lora,
] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const out: any[] = [];

  for (const endpoint of ENDPOINTS) {
    const row: any = { endpoint };

    try {
      const status: any = await getFalJobStatus(endpoint, jobId);
      row.statusOk = true;
      row.status = status?.status ?? status?.request_status ?? status?.state ?? null;
      row.statusKeys = Object.keys(status || {});
      row.statusSample = status;
    } catch (e: any) {
      row.statusOk = false;
      row.statusError = String(e?.message || e);
    }

    try {
      const result: any = await getFalJobResult(endpoint, jobId);
      row.resultOk = true;
      row.resultKeys = Object.keys(result || {});
      row.resultSample = result;
    } catch (e: any) {
      row.resultOk = false;
      row.resultError = String(e?.message || e);
    }

    out.push(row);
  }

  return NextResponse.json({ jobId, endpoints: out }, { status: 200 });
}
