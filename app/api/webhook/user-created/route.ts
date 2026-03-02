import { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { assignPlan } from "@/lib/assign-plan";
import { PLAN_FREE } from "@/constants";
import { getPlanIdByTier } from "@/lib/get-plan-id-by-tier";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

async function validateRequest(request: Request) {
  const payloadString = await request.text();
  const headerPayload = await headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("[CLERK WEBHOOK] Missing Svix signature headers");
  }

  const svixHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };

  console.log("🔐 [CLERK WEBHOOK] Validating webhook signature...");
  return new Webhook(webhookSecret).verify(payloadString, svixHeaders) as WebhookEvent;
}


export async function POST(request: Request) {
  let payload: WebhookEvent;

  try {
    console.log("📥 [CLERK WEBHOOK] Receiving webhook...");
    payload = await validateRequest(request);
    console.log(`✅ [CLERK WEBHOOK] Webhook validated: ${payload.type}`);
  } catch (err) {
    console.error("❌ [CLERK WEBHOOK] Validation failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (payload.type) {
    case "user.created": {
      const user = payload.data as UserJSON;
      const userId = user.id;

      console.log(`👤 [CLERK WEBHOOK] New user created: ${userId}`);

      try {
        console.log(`🔎 [CLERK WEBHOOK] Fetching free plan ID for tier: ${PLAN_FREE}`);
        const freePlanId = await getPlanIdByTier(PLAN_FREE);

        if (!freePlanId) {
          console.error("❌ [CLERK WEBHOOK] Default free plan not found in DB");
          throw new Error("Default plan not found");
        }

        console.log("📝 [CLERK WEBHOOK] Creating user record in DB...");
        await prismadb.user.create({
          data: {
            userId: userId!,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email_addresses[0].email_address,
            imageUrl: user.has_image ? user.image_url : "",
            referralCode: "",
            firstVisit: true,
          },
        });

        console.log("🎯 [CLERK WEBHOOK] Assigning free plan to user...");
        await assignPlan(userId!, freePlanId);

        console.log("🎉 [CLERK WEBHOOK] User setup completed successfully");
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error("🔥 [CLERK WEBHOOK] DB operation failed:", err);
        return NextResponse.json({ error: "Failed to create user records" }, { status: 500 });
      }
    }

    case "user.deleted": {
      const user = payload.data as { id: string };
      const userId = user.id;

      console.log(`🗑️ [CLERK WEBHOOK] Deleting user: ${userId}`);
      try {
        await prismadb.user.delete({ where: { userId } });
        console.log(`✅ [CLERK WEBHOOK] User ${userId} deleted from DB`);
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error("🔥 [CLERK WEBHOOK] Failed to delete user:", err);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
      }
    }

    default:
      console.log(`ℹ️ [CLERK WEBHOOK] Ignored event type: ${payload.type}`);
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
  }
}

