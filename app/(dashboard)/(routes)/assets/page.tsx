"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Folder, Heart, ImageIcon, Loader2, Search, Video, WandSparkles } from "lucide-react";
import { toast } from "sonner";

type AssetType = "image" | "video" | "lipsync" | "upscaled";

type RawItem = {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  outputUrl?: string;
  status?: string;
  createdAt?: string;
  prompt?: string;
};

type AssetItem = {
  id: string;
  type: AssetType;
  url?: string;
  status?: string;
  createdAt?: string;
  prompt?: string;
};

// localStorage key intentionally kept on the original misspelling
// ("travia-…") even though the brand is "Tavira". Renaming it would
// invalidate every existing user's liked-asset state on next page
// load. The string is never user-visible — only a private key in
// their browser — so the brand-consistency win isn't worth the data
// loss. If we ever migrate, do it by reading from BOTH keys and
// writing to the new one for one release window, then drop the old
// read after the next deploy.
const LIKE_STORAGE_KEY = "travia-assets-liked";

function formatDayLabel(date?: string) {
  if (!date) return "Earlier";
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  if (t === today) return "Today";
  if (t === yesterday) return "Yesterday";
  return "Earlier";
}

/**
 * Build a download-friendly filename. Uses the first few words of the
 * prompt (sluggified) when available, otherwise falls back to the
 * asset id. Always prefixed with "tavira-{type}-" so it groups
 * naturally in the user's Downloads folder.
 */
function buildDownloadFilename(item: AssetItem): string {
  const base =
    (item.prompt || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .slice(0, 6)
      .join("-") || item.id.slice(0, 12);

  // Extension inferred from URL when possible, otherwise sensible
  // defaults per asset type.
  const url = item.url ?? "";
  const match = url.match(/\.(png|jpe?g|webp|gif|mp4|webm|mov)(?:$|\?)/i);
  const ext = match
    ? match[1].toLowerCase().replace("jpeg", "jpg")
    : item.type === "video" || item.type === "lipsync"
      ? "mp4"
      : "png";

  return `tavira-${item.type}-${base}.${ext}`;
}

/**
 * Fetch the asset and trigger a browser download. We use fetch+blob
 * rather than `<a download>` because FAL CDN doesn't always set a
 * Content-Disposition header — without it, browsers navigate to the
 * file instead of downloading it. The blob approach guarantees the
 * file lands in Downloads with our filename regardless of how the
 * remote serves it.
 *
 * Falls back to a new-tab navigation if the fetch fails (e.g.
 * occasional CORS hiccup); user can right-click → Save As from there.
 */
async function downloadAsset(item: AssetItem): Promise<void> {
  if (!item.url) {
    toast.error("This asset isn't ready yet.");
    return;
  }
  try {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = buildDownloadFilename(item);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after the download starts; small delay lets the browser
    // pick up the blob first on slower devices.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  } catch (err) {
    console.warn("[ASSETS] direct download failed, falling back to new tab", err);
    window.open(item.url, "_blank", "noopener,noreferrer");
    toast.info("Opened in a new tab — right-click to save.");
  }
}

export default function AssetsPage() {
  const [images, setImages] = useState<RawItem[]>([]);
  const [videos, setVideos] = useState<RawItem[]>([]);
  const [lipsyncs, setLipsyncs] = useState<RawItem[]>([]);
  const [upscales, setUpscales] = useState<RawItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<"all" | "liked" | AssetType>("all");
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LIKE_STORAGE_KEY);
      if (saved) setLikedIds(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(likedIds));
  }, [likedIds]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [imgRes, vidRes, lipRes, upRes] = await Promise.all([
          fetch("/api/tools/image").catch(() => null),
          fetch("/api/tools/video").catch(() => null),
          fetch("/api/tools/lipsync").catch(() => null),
          fetch("/api/tools/image-upscale").catch(() => null),
        ]);

        const imgJson = imgRes ? await imgRes.json().catch(() => ({})) : {};
        const vidJson = vidRes ? await vidRes.json().catch(() => ({})) : {};
        const lipJson = lipRes ? await lipRes.json().catch(() => ({})) : {};
        const upJson = upRes ? await upRes.json().catch(() => ({})) : {};

        setImages(Array.isArray(imgJson?.images) ? imgJson.images : []);
        setVideos(Array.isArray(vidJson?.videos) ? vidJson.videos : []);
        setLipsyncs(Array.isArray(lipJson?.lipsyncs) ? lipJson.lipsyncs : []);
        setUpscales(Array.isArray(upJson?.upscales) ? upJson.upscales : []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const items = useMemo<AssetItem[]>(() => {
    const imageItems: AssetItem[] = images.map((i) => ({
      id: i.id,
      type: "image",
      url: i.imageUrl,
      status: i.status,
      createdAt: i.createdAt,
      prompt: i.prompt,
    }));

    const videoItems: AssetItem[] = videos.map((v) => ({
      id: v.id,
      type: "video",
      url: v.videoUrl,
      status: v.status,
      createdAt: v.createdAt,
      prompt: v.prompt,
    }));

    const lipsyncItems: AssetItem[] = lipsyncs.map((l) => ({
      id: l.id,
      type: "lipsync",
      url: l.videoUrl || l.outputUrl,
      status: l.status,
      createdAt: l.createdAt,
      prompt: l.prompt,
    }));

    const upscaleItems: AssetItem[] = upscales.map((u) => ({
      id: u.id,
      type: "upscaled",
      url: u.imageUrl || u.outputUrl,
      status: u.status,
      createdAt: u.createdAt,
      prompt: u.prompt,
    }));

    return [...imageItems, ...videoItems, ...lipsyncItems, ...upscaleItems].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [images, videos, lipsyncs, upscales]);

  const counts = useMemo(() => {
    const byType = {
      image: items.filter((i) => i.type === "image").length,
      video: items.filter((i) => i.type === "video").length,
      lipsync: items.filter((i) => i.type === "lipsync").length,
      upscaled: items.filter((i) => i.type === "upscaled").length,
    };

    return {
      all: items.length,
      liked: items.filter((i) => likedIds.includes(i.id)).length,
      ...byType,
    };
  }, [items, likedIds]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const inBucket =
        bucket === "all"
          ? true
          : bucket === "liked"
            ? likedIds.includes(item.id)
            : item.type === bucket;

      const q = query.trim().toLowerCase();
      const inSearch = !q || (item.prompt || "").toLowerCase().includes(q);
      return inBucket && inSearch;
    });
  }, [items, bucket, query, likedIds]);

  const grouped = useMemo(() => {
    return filteredItems.reduce<Record<string, AssetItem[]>>((acc, item) => {
      const label = formatDayLabel(item.createdAt);
      if (!acc[label]) acc[label] = [];
      acc[label].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const toggleLike = (id: string) => {
    setLikedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Per-item downloading state so we can show a spinner ONLY on the
  // card currently being downloaded (multiple clicks on different
  // cards in quick succession all work in parallel — each gets its
  // own ID in the Set). Set is fine here; cards are <100 in practice.
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (item: AssetItem) => {
    setDownloadingIds((prev) => new Set(prev).add(item.id));
    try {
      await downloadAsset(item);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-3 h-fit sticky top-20">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <button onClick={() => setBucket("all")} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${bucket === "all" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"}`}>
              <span className="inline-flex items-center gap-2"><Folder className="h-4 w-4" /> All</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{counts.all}</span>
            </button>
            <button onClick={() => setBucket("liked")} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${bucket === "liked" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"}`}>
              <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> Liked</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{counts.liked}</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Tools</p>
            <div className="space-y-1">
              <button onClick={() => setBucket("image")} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${bucket === "image" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"}`}>
                <span className="inline-flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{counts.image}</span>
              </button>
              <button onClick={() => setBucket("video")} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${bucket === "video" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"}`}>
                <span className="inline-flex items-center gap-2"><Video className="h-4 w-4" /> Video</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{counts.video}</span>
              </button>
              <button onClick={() => setBucket("lipsync")} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${bucket === "lipsync" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"}`}>
                <span className="inline-flex items-center gap-2"><WandSparkles className="h-4 w-4" /> Lipsync</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{counts.lipsync}</span>
              </button>
              <button onClick={() => setBucket("upscaled")} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${bucket === "upscaled" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"}`}>
                <span className="inline-flex items-center gap-2"><WandSparkles className="h-4 w-4" /> Upscaled</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{counts.upscaled}</span>
              </button>
            </div>
          </div>
        </aside>

        <main>
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white">All assets</h1>
          </div>

          {loading ? (
            <div className="text-sm text-zinc-400">Loading assets...</div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
              No assets found for this filter.
            </div>
          ) : (
            <div className="space-y-8">
              {(["Today", "Yesterday", "Earlier"] as const).map((label) => {
                const section = grouped[label] || [];
                if (section.length === 0) return null;
                return (
                  <section key={label}>
                    <h2 className="mb-3 text-lg font-semibold text-white">{label}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {section.map((item) => (
                        <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                          <div className="aspect-[4/5] bg-black/30">
                            {item.url ? (
                              item.type === "video" || item.type === "lipsync" ? (
                                <video src={item.url} className="h-full w-full object-cover" controls />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.url} alt={item.prompt || item.id} className="h-full w-full object-cover" />
                              )
                            ) : (
                              <div className="h-full w-full grid place-items-center text-xs text-zinc-500">{item.status || "processing"}</div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="rounded-full border border-white/15 px-2 py-0.5 text-zinc-300 capitalize">{item.type}</span>
                              <div className="flex items-center gap-1.5">
                                {/* Download — disabled when the asset hasn't
                                    finished generating yet (no URL). Shows a
                                    spinner during the fetch+blob roundtrip
                                    so the user knows the click registered. */}
                                <button
                                  type="button"
                                  onClick={() => handleDownload(item)}
                                  disabled={!item.url || downloadingIds.has(item.id)}
                                  aria-label={`Download ${item.type}`}
                                  title="Download"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-zinc-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {downloadingIds.has(item.id) ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleLike(item.id)}
                                  aria-label={likedIds.includes(item.id) ? "Unlike" : "Like"}
                                  title={likedIds.includes(item.id) ? "Unlike" : "Like"}
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${likedIds.includes(item.id) ? "border-pink-400/60 text-pink-300 hover:text-pink-200" : "border-white/15 text-zinc-400 hover:text-zinc-200 hover:border-white/30"}`}
                                >
                                  <Heart className={`h-3.5 w-3.5 ${likedIds.includes(item.id) ? "fill-current" : ""}`} />
                                </button>
                              </div>
                            </div>
                            <p className="line-clamp-2 text-xs text-zinc-400">{item.prompt || "Generated asset"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
