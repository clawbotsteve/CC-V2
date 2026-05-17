/**
 * Product-URL scraper for Ad Studio.
 *
 * An ecom operator pastes a Shopify / Amazon / generic product page
 * URL; we fetch it server-side and pull the product image + title so
 * they don't have to manually download/upload anything. This is the
 * single biggest friction-remover in the "this is built for me"
 * flow.
 *
 * SECURITY — this endpoint fetches an ARBITRARY user-supplied URL.
 * That's a textbook SSRF vector (attacker points it at internal
 * services, cloud metadata, localhost). Guards below:
 *   - Only http / https schemes
 *   - DNS-resolve the host and reject private / loopback / link-local
 *     / cloud-metadata IP ranges (incl. the 169.254.169.254 trap)
 *   - 8s timeout, capped response read
 *   - Realistic UA (many product pages 403 a bare fetch UA)
 *
 * Extraction is regex-based on the HTML (no parser dep). Product
 * pages near-universally expose OpenGraph + JSON-LD Product schema,
 * which is more than enough; we degrade gracefully (return what we
 * found, let the user fall back to manual upload).
 */

import { lookup } from "dns/promises";
import net from "net";

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 2_000_000; // 2 MB of HTML is plenty for meta tags

export interface ScrapedProduct {
  title: string | null;
  imageUrl: string | null;
  /** Extra image candidates so the UI can offer a picker if the
   *  primary og:image isn't the best shot. */
  imageCandidates: string[];
  sourceUrl: string;
}

/** Reject private / loopback / link-local / unique-local / cloud
 *  metadata addresses. Covers IPv4 + the common IPv6 cases. */
function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local + 169.254.169.254 metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1") return true; // loopback
    if (v.startsWith("fe80")) return true; // link-local
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique-local
    if (v.startsWith("::ffff:")) {
      // IPv4-mapped — re-check the embedded v4.
      const v4 = v.split(":").pop() || "";
      if (net.isIPv4(v4)) return isBlockedIp(v4);
    }
    return false;
  }
  return true; // unknown format → block
}

async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) product links are supported.");
  }
  // Resolve every A/AAAA record and ensure none are internal. We
  // check ALL records (not just the first) to defeat DNS-rebinding-ish
  // multi-record tricks.
  let records: { address: string }[];
  try {
    records = await lookup(url.hostname, { all: true });
  } catch {
    throw new Error("Couldn't resolve that domain.");
  }
  if (records.length === 0 || records.some((r) => isBlockedIp(r.address))) {
    throw new Error("That URL points to a blocked address.");
  }
  return url;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function metaContent(html: string, key: string): string | null {
  // Matches <meta property="og:image" content="..."> in either
  // attribute order.
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

/** Pull name/image out of any JSON-LD Product blocks. */
function fromJsonLd(html: string): { title: string | null; images: string[] } {
  const out = { title: null as string | null, images: [] as string[] };
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const b of blocks) {
    let json: any;
    try {
      json = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(json) ? json : json?.["@graph"] ? json["@graph"] : [json];
    for (const node of nodes) {
      const type = node?.["@type"];
      const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
      if (!isProduct) continue;
      if (!out.title && typeof node.name === "string") out.title = node.name.trim();
      const img = node.image;
      if (typeof img === "string") out.images.push(img);
      else if (Array.isArray(img)) out.images.push(...img.filter((x) => typeof x === "string"));
      else if (img?.url) out.images.push(img.url);
    }
  }
  return out;
}

export async function scrapeProduct(rawUrl: string): Promise<ScrapedProduct> {
  const url = await assertSafeUrl(rawUrl);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  let html: string;
  try {
    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Many ecom pages 403 a default fetch UA.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(
        `The page returned ${res.status}. Some stores block scrapers — upload the product image manually instead.`,
      );
    }
    // Cap how much we read so a malicious/huge page can't OOM us.
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Couldn't read that page.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX_HTML_BYTES) break;
        chunks.push(value);
      }
    }
    html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("That page took too long to load. Try uploading the image manually.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  // Title: og:title → twitter:title → JSON-LD → <title> → <h1>
  const jsonLd = fromJsonLd(html);
  const title =
    metaContent(html, "og:title") ||
    metaContent(html, "twitter:title") ||
    jsonLd.title ||
    decodeEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "") ||
    decodeEntities(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || "") ||
    null;

  // Images: og:image (primary) → twitter:image → JSON-LD images.
  // Resolve relative URLs against the page origin.
  const raw: string[] = [];
  const og = metaContent(html, "og:image");
  if (og) raw.push(og);
  const tw = metaContent(html, "twitter:image");
  if (tw) raw.push(tw);
  raw.push(...jsonLd.images);

  const seen = new Set<string>();
  const imageCandidates: string[] = [];
  for (const r of raw) {
    let abs: string;
    try {
      abs = new URL(r, url).toString();
    } catch {
      continue;
    }
    if (!seen.has(abs)) {
      seen.add(abs);
      imageCandidates.push(abs);
    }
  }

  return {
    title: title || null,
    imageUrl: imageCandidates[0] || null,
    imageCandidates,
    sourceUrl: url.toString(),
  };
}
