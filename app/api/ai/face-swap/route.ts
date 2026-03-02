// app/api/face-swap/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl } from "@/lib/utils";
import { FaceSwapInput } from "@/types/swap";
import { AdvancedFaceSwapInput } from "@fal-ai/client/endpoints";
import { submitFalJob } from "@/lib/fal-client";


export async function POST(req: NextRequest) {
  try {
    const data: FaceSwapInput = await req.json();

    const webhookUrl = getWebhookUrl("/api/webhook/face-swap");
    const input = {
      face_image_0: data.face_image0,
      gender_0: data.gender0,
      face_image_1: data.face_image1 ? data.face_image1 : undefined,
      gender_1: data.gender1,
      target_image: data.target_image,
      workflow_type: data.workflow_type,
      upscale: data.upscale,
      detailer: data.detailer
    } as any

    const { request_id } = await submitFalJob("easel-ai/advanced-face-swap", {
      input,
      webhookUrl,
    });

    return NextResponse.json({
      success: true,
      requestId: request_id,
      message: "Face swap submitted. Result will be sent to webhook.",
    });
  } catch (error) {
    console.error("Face swap submission error:", error);
    return NextResponse.json({ error: "Failed to submit face swap job." }, { status: 500 });
  }
}
