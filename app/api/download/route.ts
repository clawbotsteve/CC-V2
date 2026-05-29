import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download?url=<asset-url>&name=<filename>
 *
 * Server-side proxy that re-streams a remote asset (R2-hosted image,
 * video, LoRA, etc.) with `Content-Disposition: attachment` so the
 * browser triggers a file download instead of opening the asset
 * inline in a new tab.
 *
 * Why this exists (2026-05-29): R2's public bucket (pub-*.r2.dev)
 * doesn't send CORS headers. Our `<a href={r2Url} download>` and
 * fetch-then-blob client-side download tricks both fail cross-origin
 * — the browser ignores the `download` attribute and opens the file
 * inline. This proxy makes the cross-origin fetch server-side (no
 * CORS check in Node) and sets the attachment header so the browser
 * downloads natively.
 *
 * Security: the proxy ONLY fetches from a strict allowlist of asset
 * hosts we trust (our own R2 bucket + legacy CDNs that host
 * historical generations). Without the allowlist this would be an
 * open proxy — anyone could route arbitrary traffic through your
 * server (bandwidth abuse, SSRF risk, exfiltration). Add new hosts
 * here ONLY if they're CDNs we control or pin (no generic domains).
 */

const ALLOWED_HOSTS = new Set<string>([
  // Cloudflare R2 public bucket — every Tavira-generated asset
  "pub-6dd6ba87a066479c9d0f0464508e3379.r2.dev",
  // Legacy generations still alive on Replicate's auto-expiring CDN
  // (24h TTL — included so users can download recent generations that
  // haven't been mirrored yet, but they'll 404 after a day).
  "replicate.delivery",
  // FAL CDN — even older generations from the pre-Replicate era.
  "v3.fal.media",
  "fal.media",
]);

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.has(hostname)) return true;
  // Wildcard match for *.replicate.delivery / *.fal.media subdomains
  if (hostname.endsWith(".replicate.delivery")) return true;
  if (hostname.endsWith(".fal.media")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const requestedName = req.nextUrl.searchParams.get("name");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only https URLs are allowed" },
      { status: 400 },
    );
  }

  if (!isAllowedHost(parsed.hostname)) {
    return NextResponse.json(
      { error: `Host not allowed: ${parsed.hostname}` },
      { status: 403 },
    );
  }

  // Stream the asset from the origin. Server-side fetch has no CORS
  // restriction, so this works regardless of how the origin's CORS
  // policy is configured.
  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch (err: any) {
    console.error("[DOWNLOAD-PROXY] upstream fetch failed", url, err?.message || err);
    return NextResponse.json(
      { error: "Failed to reach the asset host" },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status || 502 },
    );
  }

  // Build the filename. Prefer the caller's hint; otherwise derive
  // from the URL path. Sanitize to prevent header injection and
  // filesystem-unfriendly characters.
  const fallbackName =
    parsed.pathname.split("/").pop()?.split("?")[0] || "download";
  const rawName = (requestedName || fallbackName).slice(0, 200);
  const safeName = rawName.replace(/[^a-zA-Z0-9._\- ]/g, "_");

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", contentType);
  responseHeaders.set(
    "Content-Disposition",
    `attachment; filename="${safeName}"`,
  );
  if (contentLength) responseHeaders.set("Content-Length", contentLength);
  // Assets we serve are immutable (R2 mirrors are content-addressed).
  // Let the browser + any intermediate cache hold them for a year.
  responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(upstream.body, {
    status: 200,
    headers: responseHeaders,
  });
}
