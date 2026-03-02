// lib/chargeUserClient.ts
import { ToolType } from "@prisma/client";

export type ChargeToolParamsClient = {
  userId: string;
  tool: ToolType | string;
  variant?: string;
  usageId: string;
  usageTable:
  | "Upscaled"
  | "ImageEdit"
  | "ImageAnalysis"
  | "FaceSwap"
  | "GeneratedImage"
  | "GeneratedVideo"
  | "AvatarTraining";
  markFailed?: boolean;
};

export async function chargeUserForTool(params: ChargeToolParamsClient) {
  console.log("[Client] Charging user for tool usage:");
  console.log("Payload:", params);

  try {
    const res = await fetch("/api/charge-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("[Client] Charge failed:", errorData);
      throw new Error(errorData.error || "Failed to charge user");
    }

    const result = await res.json();
    console.log("[Client] Charge successful:", result);


    return result;
  } catch (error) {
    console.error("[Client] Error calling /api/charge-user:", error);
    throw error;
  }
}
