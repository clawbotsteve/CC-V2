import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { absoluteUrl } from "@/lib/utils";
import axios from "axios";
import { ImageEditorInput } from "@/types/editor";
import { checkAvailableCredit } from "@/lib/check-available-credit";
import { ToolType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const images = await prismadb.imageEdit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to fetch image edits", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: ImageEditorInput = await req.json();

    const { canUse, creditCost } = await checkAvailableCredit({
      userId: userId,
      tool: ToolType.IMAGE_EDITOR,
    });

    if (!canUse) {
      return new NextResponse(`Insufficient credits. Required: ${creditCost}`, { status: 403 });
    }

    if (!data.prompt) {
      return NextResponse.json({ error: "Prompt is missing." }, { status: 400 });
    }

    if (!data.image_url) {
      return NextResponse.json({ error: "Upload an Image." }, { status: 400 });
    }

    // Correct axios POST call
    const falRes = await axios.post(
      absoluteUrl("/api/ai/image-edit"),
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Check status code (axios throws on non-2xx by default, but just in case)
    if (falRes.status < 200 || falRes.status >= 300) {
      console.error("[FAL_SUBMIT_ERROR]", falRes.data);
      return NextResponse.json({ error: "FAL queue submission failed" }, { status: 500 });
    }

    const { requestId } = falRes.data;
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 500 });
    }

    // Save the queued job to your DB
    await prismadb.imageEdit.create({
      data: {
        id: requestId, // ensure requestId matches your DB ID format
        userId,
        prompt: data.prompt,
        originalUrl: data.image_url,
        editedUrl: "",
        strength: data.strength,
        steps: data.num_inference_steps,
        adherence: data.guidance_scale,
        count: data.seed,
        safe: data.enable_safety_checker,
        status: "queued",
        creditUsed: 1,
      },
    });

    return NextResponse.json({ jobId: requestId }, { status: 200 });
  } catch (err) {
    console.error("[IMAGE_EDIT_POST_ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
