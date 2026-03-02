// lib/getWebhookData.ts
import { NextRequest } from "next/server";
import { getRawBodyFromStream } from "../utils";

export async function getWebhookData(req: NextRequest) {
  const rawBody = await getRawBodyFromStream(req.body as any);
  const bodyText = rawBody.toString("utf-8");
  const json = JSON.parse(bodyText);

  const requestId = req.headers.get("x-fal-webhook-request-id") || "";
  const userId = req.headers.get("x-fal-webhook-user-id") || "";
  const timestamp = req.headers.get("x-fal-webhook-timestamp") || "";
  const signature = req.headers.get("x-fal-webhook-signature") || "";

  return { rawBody, json, requestId, userId, timestamp, signature };
}
