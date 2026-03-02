import { NextRequest, NextResponse } from "next/server";
import { Soul2Input } from "@/types/image";

const DEFAULT_BASE_URL = "https://platform.higgsfield.ai";

function pickRequestId(data: any): string | undefined {
  return data?.request_id || data?.requestId || data?.id || data?.data?.request_id;
}

export async function POST(req: NextRequest) {
  try {
    const body: Soul2Input = await req.json();
    const apiKey = process.env.HIGGSFIELD_API_KEY;
    const baseUrl = (process.env.HIGGSFIELD_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

    if (!apiKey) {
      return NextResponse.json({ error: "Missing HIGGSFIELD_API_KEY" }, { status: 500 });
    }

    const payload = {
      prompt: body.prompt,
      num_images: body.num_images ?? 1,
      seed: body.seed,
      output_format: body.output_format ?? "png",
      aspect_ratio: body.aspect_ratio,
    };

    const candidatePaths = [
      "/higgsfield-ai/soul/reference",
      "/v1/higgsfield-ai/soul/reference",
    ];

    const authHeaderVariants: HeadersInit[] = [
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
    ];

    let lastStatus = 500;
    let lastData: any = null;

    for (const path of candidatePaths) {
      for (const headers of authHeaderVariants) {
        const response = await fetch(`${baseUrl}${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        lastStatus = response.status;
        lastData = data;

        if (!response.ok) continue;

        const requestId = pickRequestId(data);
        if (!requestId) {
          return NextResponse.json(
            { error: "Missing request id from Soul 2.0 response", details: data },
            { status: 500 }
          );
        }

        return NextResponse.json({ requestId, raw: data });
      }

      if (lastStatus !== 401) {
        // If this path is valid but failed for non-auth reasons, stop trying auth variants.
        break;
      }
    }

    return NextResponse.json(
      { error: lastData?.error || lastData?.message || "Soul 2.0 request failed", details: lastData },
      { status: lastStatus || 500 }
    );
  } catch (error: any) {
    console.error("Soul 2.0 generate error:", error);
    const details = process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined;
    return NextResponse.json({ error: "Failed to generate Soul 2.0 image", details }, { status: 500 });
  }
}
