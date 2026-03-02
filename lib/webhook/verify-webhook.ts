// lib/verifyWebhook.ts

import { verifyFalWebhookSignature } from "../verify-fal-webhook";

export async function verifyWebhook(
  requestId: string,
  userId: string,
  timestamp: string,
  signature: string,
  rawBody: Buffer
) {
  if (!requestId) return false;
  return verifyFalWebhookSignature(requestId, userId, timestamp, signature, rawBody);
}
