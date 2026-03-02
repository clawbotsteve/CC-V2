import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { absoluteUrl } from "@/lib/utils";
import axios from "axios";
import { SafetyLevel, ToolType } from "@prisma/client";
import { convertAspectRatio } from "@/lib/convert-aspect-ratio";
import { FaceEnhanceInput } from "@/types/enhance";
import { checkAvailableCredit } from "@/lib/check-available-credit";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const faceEnhances = await prismadb.faceEnhance.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ faceEnhances });
  } catch (error) {
    console.error("Failed to fetch face swaps", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: FaceEnhanceInput = await req.json();

    const { canUse, creditCost } = await checkAvailableCredit({
      userId: userId,
      tool: ToolType.FACE_ENHANCE,
    });

    if (!canUse) {
      return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
    }

    if (!body.image) {
      return NextResponse.json({ error: "Missing targetImage" }, { status: 400 });
    }

    // axios POST request
    const falRes = await axios.post(absoluteUrl("/api/ai/face-enhance"), body, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Axios throws for non-2xx by default, so no need to check falRes.ok
    const { requestId } = falRes.data;
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 500 });
    }

    // Save queued job
    await prismadb.faceEnhance.create({
      data: {
        id: requestId,
        userId,
        originalUrl: body.image,
        editedUrl: "",
        aspectRatio: convertAspectRatio(body.aspect_ratio),
        guidanceScale: body.guidance_scale,
        inferenceStep: body.num_inference_step,
        outputFormat: body.output_format,
        safetyLevel: `LEVEL_${body.safety_level}` as SafetyLevel, // cast to match the enum
        nsfwFlag: false,
        generationTime: new Date(),
        status: "queued",
        creditUsed: 3,
      },
    });

    return NextResponse.json({ jobId: requestId }, { status: 200 });
  } catch (err: any) {
    console.error("[FACE_ENHANCE_POST_ERROR]", err.response?.data || err.message || err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
