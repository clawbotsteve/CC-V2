// app/api/webhook/prompt/route.ts

import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { ToolType } from "@prisma/client";
import { FalPromptGenerationOutput } from "@/types/prompt";
import { getWebhookData } from "@/lib/webhook/get-webhook-data";
import { verifyWebhook } from "@/lib/webhook/verify-webhook";
import { updateJobStatus } from "@/lib/webhook/update-job-status";

export async function POST(req: NextRequest) {
  try {
    // Extract webhook data and headers
    const { rawBody, json, requestId, userId, timestamp, signature } = await getWebhookData(req);

    // Verify webhook signature
    const valid = await verifyWebhook(requestId, userId, timestamp, signature, rawBody);
    if (!valid) return new NextResponse("Unauthorized", { status: 401 });

    // Map raw JSON to typed union
    const data: FalPromptGenerationOutput = json;

    // Fetch job record
    const jobRecord = await prismadb.imageAnalysis.findUnique({
      where: { id: requestId },
      select: { userId: true, status: true },
    });

    if (!jobRecord?.userId) return new NextResponse("Missing userId", { status: 400 });

    // Early exit if already completed
    if (jobRecord.status === "completed") {
      console.log(`[PROMPT WEBHOOK] Job ${requestId} already completed`);
      return new NextResponse("Prompt saved", { status: 200 });
    }

    // Handle successful prompt generation
    if (data.status === "OK" && data.payload?.prompt) {
      const status = await updateJobStatus({
        model: prismadb.imageAnalysis,
        requestId,
        userId: jobRecord.userId,
        urlValue: data.payload.prompt,
        toolType: ToolType.PROMPT_GENERATOR,
      });

      return new NextResponse(
        status === "completed" ? "Prompt saved" : "Marked as failed",
        { status: 200 }
      );
    }

    // Handle error case
    if (data.status === "ERROR" || !data.payload?.prompt) {
      console.warn(`[PROMPT WEBHOOK] Generation failed for requestId: ${requestId}`, {
        error: data.error,
      });

      await updateJobStatus({
        model: prismadb.imageAnalysis,
        requestId,
        userId: jobRecord.userId,
        urlValue: undefined,
        toolType: ToolType.PROMPT_GENERATOR,
      });

      return new NextResponse("Marked as failed", { status: 200 });
    }

    console.warn(`[PROMPT WEBHOOK] Unhandled format for requestId: ${requestId}`);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("[PROMPT WEBHOOK] Handler error:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
