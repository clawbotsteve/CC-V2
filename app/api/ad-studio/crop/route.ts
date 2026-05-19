import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cropBufferTo916 } from "@/lib/ad-studio/crop916";

/**
 * GET /api/ad-studio/crop?u=<encoded image url>
 *
 * Returns the image center-cropped to a true 9:16 (TikTok/Reels ad
 * spec). GPT Image 2 only outputs up to 2:3, so the Download links
 * point here to hand the user a genuine vertical file. Auth-gated
 * and host-allowlisted (SSRF-safe — only our generation providers).
 */
const ALLOWED_HOST = /(^|\.)(replicate\.delivery|replicate\.com|taviralabsai\.com|amazonaws\.com)$/i;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = new URL(req.url).searchParams.get("u");
  if (!u) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOST.test(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString());
    if (!res.ok) {
      return NextResponse.json(
        { error: `Source fetch failed (${res.status})` },
        { status: 502 },
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const cropped = await cropBufferTo916(buf);
    return new NextResponse(new Uint8Array(cropped), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="tavira-ad-9x16.png"',
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    console.error("[AD-STUDIO_CROP]", err?.message || err);
    return NextResponse.json({ error: "Crop failed" }, { status: 500 });
  }
}
