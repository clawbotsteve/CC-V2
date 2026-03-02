import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { absoluteUrl } from "@/lib/utils";
import axios from "axios";
import { FaceSwapInput } from "@/types/swap";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const faceSwaps = await prismadb.faceSwap.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ faceSwaps });
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

    const data: FaceSwapInput = await req.json();

    const { canUse, creditCost } = await checkAvailableCredit({
      userId: userId,
      tool: ToolType.IMAGE_EDITOR,
      variant: "face_swap",
    });

    if (!canUse) {
      return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
    }

    if (!data.face_image0) {
      return NextResponse.json({ error: "Missing sourceImage" }, { status: 400 });
    }

    if (!data.target_image) {
      return NextResponse.json({ error: "Missing targetImage" }, { status: 400 });
    }

    // axios POST request
    const falRes = await axios.post(absoluteUrl("/api/ai/face-swap"),
      data,
      {
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
    await prismadb.faceSwap.create({
      data: {
        id: requestId, // ensure this matches your DB schema
        userId,
        firstFace: data.face_image0,
        firstUserGender: data.gender0,
        secondFace: data.face_image1,
        secondUserGender: data.gender1,
        targetImage: data.target_image,
        workflowType: data.workflow_type,
        upscale2x: data.upscale,
        enableDetailer: data.detailer,
        status: "queued",
        generationTime: new Date(),
        creditUsed: 1,
      },
    });

    return NextResponse.json({ jobId: requestId }, { status: 200 });
  } catch (err: any) {
    console.error("[FACE_SWAP_POST_ERROR]", err.response?.data || err.message || err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
