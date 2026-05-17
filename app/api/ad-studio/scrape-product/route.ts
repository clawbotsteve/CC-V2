import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { scrapeProduct } from "@/lib/ad-studio/scrape-product";

/**
 * POST /api/ad-studio/scrape-product
 * Body: { url: string }
 *
 * Takes an ecom product page URL, returns the product title + image
 * candidates so the Ad Studio flow can auto-fill the "Your product"
 * step. Auth-gated (only signed-in users) + SSRF-guarded inside
 * scrapeProduct(). Returns a friendly error message on failure so
 * the UI can fall back to manual upload gracefully.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const url: string | undefined = body?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Paste a product URL first." }, { status: 400 });
    }

    const result = await scrapeProduct(url.trim());

    if (!result.imageUrl) {
      return NextResponse.json(
        {
          ...result,
          error:
            "Couldn't find a product image on that page. Some stores hide it from scrapers — upload the image manually instead.",
        },
        { status: 200 }, // 200: the UI shows the message + manual-upload fallback
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    // scrapeProduct throws human-readable messages for the common
    // failure modes (invalid URL, blocked address, timeout, 403).
    const message =
      typeof err?.message === "string" && err.message.length < 200
        ? err.message
        : "Couldn't fetch that page. Upload the product image manually.";
    console.warn("[AD-STUDIO_SCRAPE]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
