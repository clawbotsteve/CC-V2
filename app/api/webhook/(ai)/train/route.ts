import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { verifyFalWebhookSignature } from "@/lib/verify-fal-webhook";
import { absoluteUrl, getRawBodyFromStream } from "@/lib/utils";
import axios from "axios";
import { chargeUserForTool } from "@/lib/charge-user";
import { ToolType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Read raw body buffer for signature verification
    const rawBody = await getRawBodyFromStream(req.body as any);
    const bodyText = rawBody.toString("utf-8");
    const json = JSON.parse(bodyText);

    // Extract Falcon webhook headers
    const requestId = req.headers.get("x-fal-webhook-request-id") || "";
    const userId = req.headers.get("x-fal-webhook-user-id") || "";
    const timestamp = req.headers.get("x-fal-webhook-timestamp") || "";
    const signature = req.headers.get("x-fal-webhook-signature") || "";

    if (!requestId) {
      return new NextResponse("Missing request ID", { status: 400 });
    }

    // Verify webhook signature
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

    if (!request_id) {
      console.warn("Missing request_id in webhook body");
    }

    // Find influencer by request_id (which should map to falAvatarId)
    const influencer = await prismadb.influencer.findFirst({
      where: { id: request_id },
      // select: { userId: true, id: true },
    });

    if (!influencer) {
      console.warn("No influencer found with falAvatarId", request_id);
      // You might want to still respond 200 to avoid retries
      return new NextResponse("Influencer not found", { status: 200 });
    }

    // Handle successful training
    if (status === "OK" && payload?.config_file) {
      await prismadb.influencer.update({
        where: { id: influencer.id },
        data: {
          status: "completed",
          updatedAt: new Date(),
          loraUrl: payload.diffusers_lora_file?.url ?? null,
          configUrl: payload.config_file?.url ?? null,
        },
      });

      await chargeUserForTool({
        userId: influencer.userId,
        tool: ToolType.AVATAR_TRAINING,
        usageId: request_id,
        usageTable: "AvatarTraining",
      });

      // const apiUrl = absoluteUrl("/api/ai/train/video-intro")
      // const apiUrl = "https://d95a-203-76-145-42.ngrok-free.app/api/ai/train/video-intro"
      // console.log("api endpoint:", apiUrl)


      // start video intro
      // const generateRes = await axios.post(apiUrl, {
      //   userId: influencer.userId,
      //   influencerId: influencer.id,
      //   loraUrl: influencer.loraUrl,
      //   avatarImageUrl: influencer.avatarImageUrl,
      // },
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );

      return new NextResponse("Influencer LoRa Generation finished", { status: 200 });
    }

    // Handle training failure
    if (status === "ERROR" || error || payload_error) {
      await prismadb.influencer.update({
        where: { id: influencer.id },
        data: {
          status: "failed",
          updatedAt: new Date(),
        },
      });

      console.warn("⚠️ Influencer training failed", {
        requestId,
        error,
        payload_error,
      });

      return new NextResponse("Influencer training marked as failed", { status: 200 });
    }

    // Other/unhandled statuses
    console.log("Unhandled influencer webhook payload", json);
    return new NextResponse("Unhandled", { status: 200 });
  } catch (err) {
    console.error("Influencer webhook handler error", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
