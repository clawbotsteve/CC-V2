import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { verifyFalWebhookSignature } from "@/lib/verify-fal-webhook";
import { getRawBodyFromStream } from "@/lib/utils";
import { ToolType } from "@prisma/client";
import { chargeUserForTool } from "@/lib/charge-user";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await getRawBodyFromStream(req.body as any);
    const bodyText = rawBody.toString("utf-8");
    const json = JSON.parse(bodyText);

    const requestId = req.headers.get("x-fal-webhook-request-id") || "";
    const userId = req.headers.get("x-fal-webhook-user-id") || "";
    const timestamp = req.headers.get("x-fal-webhook-timestamp") || "";
    const signature = req.headers.get("x-fal-webhook-signature") || "";

    if (!requestId) return new NextResponse("Missing request ID", { status: 400 });

    const isValid = await verifyFalWebhookSignature(
      requestId,
      userId,
      timestamp,
      signature,
      rawBody
    );

    if (!isValid) {
      console.error("❌ Invalid signature");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status, payload, request_id, error, payload_error } = json;

    if (status === "OK" && payload?.video?.url) {
      const videoUrl = payload.video.url;

      console.log({ request_id })
      const jobRecord = await prismadb.influencer.findFirst({
        where: { introVideoRequestId: request_id },
        select: { id: true, userId: true },
      });

      console.log({ jobRecord })

      if (!jobRecord?.userId) {
        console.error("❌ No userId found in DB for job", request_id);
        return new NextResponse("Missing userId", { status: 400 });
      }

      await prismadb.influencer.update({
        where: { id: jobRecord.id },
        data: {
          status: "completed",
          introVideoUrl: videoUrl,
          updatedAt: new Date(),
        },
      });

      await chargeUserForTool({
        userId: jobRecord.userId,
        tool: ToolType.AVATAR_TRAINING,
        usageId: jobRecord.id,
        usageTable: "AvatarTraining",
      });

      return new NextResponse("Video saved", { status: 200 });
    }

    if (status === "ERROR" || error || payload_error || !payload?.video) {
      console.warn("⚠️ Video generation failed", {
        request_id,
        error,
        payload_error,
      });

      const jobRecord = await prismadb.influencer.findFirst({
        where: { introVideoRequestId: request_id },
        select: { id: true, userId: true },
      });

      console.log({ jobRecord })

      if (!jobRecord?.userId) {
        console.error("❌ No userId found in DB for job", request_id);
        return new NextResponse("Missing userId", { status: 400 });
      }

      await prismadb.influencer.update({
        where: { id: jobRecord.id },
        data: {
          status: "failed",
          introVideoUrl: "",
          updatedAt: new Date(),
        },
      });

      return new NextResponse("Marked as failed", { status: 200 });
    }

    console.log("Unhandled webhook format", json);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
