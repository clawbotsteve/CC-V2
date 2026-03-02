import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { absoluteUrl } from "@/lib/utils";
import axios from "axios";
import { PromptGenerationInput } from "@/types/prompt";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const analysis = await prismadb.imageAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalImage: true,
        description: true,
        prompt: true,
        generationTime: true,
        status: true,
        nsfwFlag: true,
        creditUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Failed to fetch image analyses", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: PromptGenerationInput = await req.json();

    const { canUse, creditCost } = await checkAvailableCredit({
      userId: userId,
      tool: ToolType.PROMPT_GENERATOR,
    });

    if (!canUse) {
      return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
    }

    if (!data.input_concept) {
      return NextResponse.json(
        { error: "Missing Input concept prompt" },
        { status: 400 }
      );
    }

    const falRes = await axios.post(
      absoluteUrl("/api/ai/image-understand"),
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!falRes.data || !falRes.data.requestId) {
      console.error("[FAL_SUBMIT_ERROR]", falRes.data);
      return NextResponse.json({ error: "FAL queue submission failed" }, { status: 500 });
    }

    const { requestId } = falRes.data;

    // Save analysis job to DB
    await prismadb.imageAnalysis.create({
      data: {
        id: requestId,
        userId,
        originalImage: data.image_url,
        description: "",
        prompt: data.input_concept,
        status: "queued",
        creditUsed: 1,
        nsfwFlag: !data.enable_safety_checker
      },
    });

    return NextResponse.json({ jobId: requestId }, { status: 200 });
  } catch (err: any) {
    console.error("[IMAGE_ANALYSIS_POST_ERROR]", err.response?.data || err.message || err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
