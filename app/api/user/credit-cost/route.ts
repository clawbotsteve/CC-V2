import { NextResponse } from "next/server";
import { ToolType } from "@prisma/client";
import { getToolCreditCost } from "@/lib/get-credit-cost"; // adjust path as needed
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/credit-cost
 *
 * API route to retrieve the credit cost for a specific tool and optional variant
 * under a given subscription tier.
 *
 * Expects JSON body with:
 * - `tier` (string): The unique subscription tier identifier (e.g., "plan_basic").
 * - `tool` (ToolType): The tool enum name (e.g., "IMAGE_GENERATOR").
 * - `variant` (string, optional): Tool variant if applicable (e.g., "standard_10s").
 *
 * Responses:
 * - 200 OK: JSON `{ creditCost: number | null }` with the credit cost or null if not found.
 * - 400 Bad Request: JSON `{ error: string }` if required parameters are missing or invalid.
 * - 500 Internal Server Error: JSON `{ error: string }` if an unexpected error occurs.
 *
 * @param {Request} req - The incoming HTTP request.
 * @returns {Promise<NextResponse>} - JSON response with credit cost or error message.
 *
 * @example
 *  Request body:
 * {
 *   "tier": "plan_pro",
 *   "tool": "PROMPT_GENERATOR",
 *   "variant": "standard_10s"
 * }
 *
 *  Response body:
 * {
 *   "creditCost": 8
 * }
 */
export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tier, tool, variant } = await req.json();

    if (!tier || !tool) {
      return NextResponse.json(
        { error: "Missing required fields: tier and tool." },
        { status: 500 }
      );
    }

    if (!Object.values(ToolType).includes(tool)) {
      return NextResponse.json(
        { error: "Invalid tool type." },
        { status: 500 }
      );
    }

    const creditCost = await getToolCreditCost({
      tier,
      tool,
      variant,
    });

    return NextResponse.json({ creditCost });
  } catch (error) {
    console.error("Error in /api/credit-cost POST:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit cost." },
      { status: 500 }
    );
  }
}
