"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles, Upload, Loader2, ArrowRight, ArrowLeft, Package,
  UserRound, Link2, Check, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/page-container";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { Button } from "@/components/ui/button";
import { uploadFiles } from "@/lib/utils";
import { AD_ANGLES, AdAngleKey } from "@/lib/ad-studio/ad-angles";
import { STOCK_CREATORS, stockCreatorImage, stockCreatorRefs, stockCreatorIdFromImage } from "@/lib/ad-studio/stock-creators";
import {
  PRODUCT_TYPES,
  ProductTypeKey,
  detectProductType,
} from "@/lib/ad-studio/product-types";

/**
 * Ad Studio — guided UGC-ad creation flow.
 *
 * Pivot PR 2.5: turned the single-panel form into a real stepped
 * experience an ecom operator wants to walk through, and added
 * paste-a-product-link auto-scrape (the biggest friction remover).
 *
 * Steps: Product -> Creator -> Angle -> Result.
 *
 * NOTE: product/creator/result previews use plain <img>, not
 * next/image. The URLs are arbitrary (scraped ecom CDNs, user
 * uploads, Replicate output) and can't all be whitelisted in
 * next.config remotePatterns. <img> sidesteps that entirely for
 * these dynamic previews.
 */

type CSCharacter = {
  id: string;
  name: string;
  characterStudioRef?: string | null;
  avatarImageUrl?: string | null;
};

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Product", "Creator", "Angle", "Your ad"];

/**
 * Higgsfield-style pre-filled hook script. The talking box should
 * never be blank — give a strong, product-aware UGC line the user
 * can ship as-is or tweak ("don't make me think").
 */
function defaultHookScript(productName: string): string {
  const p = productName.trim();
  return p
    ? `Okay I had to show you guys the ${p} — I genuinely use it every day now and I'm kind of obsessed. You need this.`
    : `Okay I had to show you guys this — I genuinely use it every day now and I'm kind of obsessed. You need this.`;
}

export default function AdStudioPage() {
  const [step, setStep] = useState<Step>(1);

  // ---- Product ----
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  // Product-type awareness — auto-detected from the name, one-tap
  // override. Drives HOW the creator presents the product (hat worn,
  // serum applied, etc.). Never required.
  const [productType, setProductType] = useState<ProductTypeKey>("generic");
  // Once the user taps a type chip we stop auto-overwriting it.
  const productTypeTouched = useRef(false);
  const autoDetectType = (text: string) => {
    if (!productTypeTouched.current) setProductType(detectProductType(text));
  };
  const [scrapeInput, setScrapeInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const productInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState(false);

  // ---- Creator ----
  const [characters, setCharacters] = useState<CSCharacter[]>([]);
  const [creatorUrl, setCreatorUrl] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const creatorInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingCreator, setUploadingCreator] = useState(false);

  // Full premade reference set when a STOCK creator is picked (sent
  // to the sample endpoint for a much harder identity lock than a
  // single shot). Empty for uploads / trained creators.
  const [creatorRefs, setCreatorRefs] = useState<string[]>([]);

  // ---- Angle / generation ----
  const [angle, setAngle] = useState<AdAngleKey>("lifestyle_hold");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Video (Seedance i2v) step ----
  const [animating, setAnimating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoPollRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Premium "Talking video ad" (Seedance-2 persona+seed T2V) ----
  const [talkingScript, setTalkingScript] = useState("");
  const [talkingDuration, setTalkingDuration] = useState<5 | 10>(5);
  const [talkingBusy, setTalkingBusy] = useState(false);
  const [talkingUrl, setTalkingUrl] = useState<string | null>(null);
  const talkingPollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/character-studio")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.characters)) {
          setCharacters(
            d.characters.filter(
              (c: CSCharacter) => c.characterStudioRef || c.avatarImageUrl,
            ),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (videoPollRef.current) clearInterval(videoPollRef.current);
      if (talkingPollRef.current) clearInterval(talkingPollRef.current);
    },
    [],
  );

  // Pre-fill the talking-hook box with a strong product-aware line
  // the moment the talking card can show (Higgsfield-style — never a
  // blank prompt). Only when still empty + not already rendered, so
  // we never clobber the user's edits.
  useEffect(() => {
    if (
      step === 4 &&
      resultUrl &&
      !talkingUrl &&
      creatorUrl &&
      stockCreatorIdFromImage(creatorUrl) &&
      !talkingScript
    ) {
      setTalkingScript(defaultHookScript(productName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, resultUrl, creatorUrl, talkingUrl]);

  const uploadOne = async (
    file: File,
    setUrl: (u: string) => void,
    setBusy: (b: boolean) => void,
  ) => {
    setBusy(true);
    try {
      const result = await uploadFiles({
        files: [file],
        maxFiles: 1,
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const url = (result as any)?.urls?.[0] || (result as any)?.url;
      if (!url) {
        toast.error("Upload failed.");
        return;
      }
      setUrl(url);
    } finally {
      setBusy(false);
    }
  };

  const scrape = async () => {
    if (!scrapeInput.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/ad-studio/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeInput.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d?.error || "Couldn't fetch that page.");
        return;
      }
      if (d?.imageUrl) {
        setProductUrl(d.imageUrl);
        if (d.title && !productName) {
          const t = String(d.title).slice(0, 90);
          setProductName(t);
          autoDetectType(t);
        }
        toast.success("Product pulled in — looking good.");
      } else {
        toast.error(d?.error || "No product image found. Upload it manually.");
      }
    } catch {
      toast.error("Something went wrong fetching that page.");
    } finally {
      setScraping(false);
    }
  };

  const pollResult = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/tools/image/status/${id}`);
        const d = await r.json();
        if (d?.status === "completed" && d?.imageUrl) {
          setResultUrl(d.imageUrl);
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (d?.status === "failed") {
          toast.error(
            "The model couldn't render this combo (it can refuse on some reference photos). Try a Tavira creator or a different angle.",
          );
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  }, []);

  const generate = async () => {
    if (!productUrl || !creatorUrl) return;
    setStep(4);
    setGenerating(true);
    setResultUrl(null);
    setVideoUrl(null);
    try {
      const res = await fetch("/api/ad-studio/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorImageUrl: creatorUrl,
          creatorRefs: creatorRefs.length > 0 ? creatorRefs : undefined,
          productImageUrl: productUrl,
          angle,
          productType,
          productName: productName.trim() || undefined,
          creatorName: creatorName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't start generation.");
        setGenerating(false);
        return;
      }
      pollResult(data.jobId);
    } catch {
      toast.error("Something went wrong.");
      setGenerating(false);
    }
  };

  // Animate the approved still into a UGC video via Seedance i2v.
  // Separate one-click step (not auto-chained) — see the endpoint
  // comment for the credit/UX reasoning.
  const animate = async () => {
    if (!resultUrl || animating) return;
    setAnimating(true);
    setVideoUrl(null);
    try {
      const res = await fetch("/api/ad-studio/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: resultUrl, productType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't start the video.");
        setAnimating(false);
        return;
      }
      const id = data.jobId;
      if (videoPollRef.current) clearInterval(videoPollRef.current);
      videoPollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/tools/video/status/${id}`);
          const d = await r.json();
          if (d?.status === "completed" && (d?.videoUrl || d?.imageUrl)) {
            setVideoUrl(d.videoUrl || d.imageUrl);
            setAnimating(false);
            if (videoPollRef.current) clearInterval(videoPollRef.current);
          } else if (d?.status === "failed") {
            toast.error("Video generation failed — the still still works as a static ad.");
            setAnimating(false);
            if (videoPollRef.current) clearInterval(videoPollRef.current);
          }
        } catch {
          /* keep polling */
        }
      }, 4000);
    } catch {
      toast.error("Something went wrong.");
      setAnimating(false);
    }
  };

  // Premium talking-video ad: the picked roster creator speaks the
  // hook line to camera WITH audio (Seedance-2 persona+seed T2V).
  // Stock creators only — the model takes no image, identity comes
  // from the creator's persona text + locked seed.
  const generateTalkingAd = async () => {
    const sid = creatorUrl ? stockCreatorIdFromImage(creatorUrl) : null;
    if (!sid || !talkingScript.trim() || talkingBusy) return;
    setTalkingBusy(true);
    setTalkingUrl(null);
    try {
      const res = await fetch("/api/ad-studio/talking-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: sid,
          script: talkingScript.trim(),
          productName: productName.trim() || undefined,
          productType,
          duration: talkingDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't start the talking video.");
        setTalkingBusy(false);
        return;
      }
      const id = data.jobId;
      if (talkingPollRef.current) clearInterval(talkingPollRef.current);
      talkingPollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/tools/video/status/${id}`);
          const d = await r.json();
          if (d?.status === "completed" && (d?.videoUrl || d?.imageUrl)) {
            setTalkingUrl(d.videoUrl || d.imageUrl);
            setTalkingBusy(false);
            if (talkingPollRef.current) clearInterval(talkingPollRef.current);
          } else if (d?.status === "failed") {
            toast.error("Talking video failed — try a shorter line or another creator.");
            setTalkingBusy(false);
            if (talkingPollRef.current) clearInterval(talkingPollRef.current);
          }
        } catch {
          /* keep polling */
        }
      }, 5000);
    } catch {
      toast.error("Something went wrong.");
      setTalkingBusy(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setProductUrl(null);
    setProductName("");
    setProductType("generic");
    productTypeTouched.current = false;
    setScrapeInput("");
    setCreatorUrl(null);
    setCreatorName("");
    setCreatorRefs([]);
    setAngle("lifestyle_hold");
    setResultUrl(null);
    setVideoUrl(null);
    setGenerating(false);
    setAnimating(false);
    setTalkingScript("");
    setTalkingDuration(5);
    setTalkingBusy(false);
    setTalkingUrl(null);
    if (talkingPollRef.current) clearInterval(talkingPollRef.current);
  };

  return (
    <PageContainer scrollable>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
        <AiAnimatedHeading
          heading="Ad Studio"
          description="Paste your product link or upload it, pick an AI creator, and get scroll-stopping UGC ad creative — no agency, no shoot."
          icon={<Sparkles className="h-6 w-6" />}
        />

        {/* Step rail */}
        <div className="mt-6 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = step > n;
            const active = step === n;
            return (
              <div key={label} className="flex-1 flex items-center gap-2">
                <div className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      done || active
                        ? "bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
                        : "bg-white/10"
                    } ${active ? "animate-pulse" : ""}`}
                  />
                  <p
                    className={`mt-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                      active
                        ? "text-[#c4b5fd]"
                        : done
                          ? "text-zinc-300"
                          : "text-zinc-500"
                    }`}
                  >
                    {n}. {label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6 md:p-8 min-h-[440px]">
          {/* ===== STEP 1 — PRODUCT ===== */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-[#a78bfa]" /> What are you advertising?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Paste your product page link — we'll pull the image and name automatically.
                Or upload a product photo.
              </p>

              {/* URL scrape */}
              <div className="mt-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Product URL
                </label>
                <div className="flex gap-2 mt-2">
                  <input
                    value={scrapeInput}
                    onChange={(e) => setScrapeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && scrape()}
                    placeholder="https://yourstore.com/products/the-product"
                    className="flex-1 rounded-lg border border-border bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#6366f1]"
                  />
                  <Button onClick={scrape} disabled={scraping || !scrapeInput.trim()}>
                    {scraping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Fetch"
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Works with Shopify, most ecom stores. Some big marketplaces block
                  scrapers — upload manually if so.
                </p>
              </div>

              <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex-1 h-px bg-white/10" /> or <span className="flex-1 h-px bg-white/10" />
              </div>

              <input
                ref={productInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadOne(f, setProductUrl, setUploadingProduct);
                }}
              />
              <Button
                variant="outline"
                onClick={() => productInputRef.current?.click()}
                disabled={uploadingProduct}
              >
                {uploadingProduct ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload product photo
              </Button>

              {productUrl && (
                <div className="mt-6 flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productUrl}
                    alt="Product"
                    className="h-28 w-28 rounded-lg object-cover bg-black border border-border"
                  />
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Product name
                    </label>
                    <input
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        autoDetectType(e.target.value);
                      }}
                      placeholder="e.g. PR-1 Vitamin C Serum"
                      className="mt-2 w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#6366f1]"
                    />
                    <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Product ready
                    </p>
                  </div>
                </div>
              )}

              {productUrl && (
                <div className="mt-6">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Product type
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    We guessed this from the name — tap to change. It decides how
                    the creator shows your product (worn, applied, held…).
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {PRODUCT_TYPES.map((pt) => {
                      const on = productType === pt.key;
                      return (
                        <button
                          key={pt.key}
                          type="button"
                          onClick={() => {
                            productTypeTouched.current = true;
                            setProductType(pt.key);
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            on
                              ? "border-[#6366f1] bg-[#6366f1]/20 text-white"
                              : "border-border bg-black/30 text-muted-foreground hover:border-[#6366f1]/60"
                          }`}
                        >
                          {pt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!productUrl}
                  className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 2 — CREATOR ===== */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserRound className="h-5 w-5 text-[#a78bfa]" /> Who's the face of the ad?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a ready-to-use Tavira creator, or one of your own trained
                creators. They stay consistent across every ad you make.
              </p>

              {/* ===== Tavira stock roster — zero-friction picks ===== */}
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#c4b5fd] mb-2">
                  Tavira creators · ready to use
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {STOCK_CREATORS.map((sc) => {
                    const img = stockCreatorImage(sc.id);
                    const selected = creatorUrl === img;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          setCreatorUrl(img);
                          setCreatorName(sc.name);
                          // Stock creator → send its full premade
                          // photo set for a hard identity lock.
                          setCreatorRefs(stockCreatorRefs(sc.id));
                        }}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-colors ${
                          selected ? "border-[#6366f1]" : "border-transparent hover:border-white/20"
                        }`}
                        title={`${sc.name} — ${sc.vibe}`}
                        style={{
                          background:
                            "linear-gradient(150deg,#1e1b3a 0%,#2a1f4d 55%,#15132a 100%)",
                        }}
                      >
                        {/* Graceful fallback: gradient + name show
                            through until /creators/{id}.jpg lands. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={sc.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 py-1.5">
                          <span className="block text-[12px] font-semibold leading-tight">
                            {sc.name}
                          </span>
                          <span className="block text-[10px] text-zinc-300 truncate">
                            {sc.vibe}
                          </span>
                        </span>
                        {selected && (
                          <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#6366f1] flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {characters.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-2">
                  Your trained creators
                </p>
              )}

              {characters.length > 0 ? (
                <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {characters.map((c) => {
                    const ref = c.characterStudioRef || c.avatarImageUrl || "";
                    const selected = creatorUrl === ref;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCreatorUrl(ref);
                          setCreatorName(c.name);
                          setCreatorRefs([]); // trained creator: single ref
                        }}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-colors ${
                          selected ? "border-[#6366f1]" : "border-transparent hover:border-white/20"
                        }`}
                        title={c.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {ref && <img src={ref} alt={c.name} className="h-full w-full object-cover" />}
                        <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[11px] truncate">
                          {c.name}
                        </span>
                        {selected && (
                          <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#6366f1] flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-6 text-xs text-muted-foreground">
                  Want a creator that's uniquely yours? Build one in{" "}
                  <Link href="/tools/character-studio" className="text-[#a78bfa] underline">
                    Character Studio
                  </Link>{" "}
                  — or upload a one-off photo below.
                </p>
              )}

              <input
                ref={creatorInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    uploadOne(f, setCreatorUrl, setUploadingCreator);
                    setCreatorName("");
                    setCreatorRefs([]); // one-off upload: single ref
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => creatorInputRef.current?.click()}
                disabled={uploadingCreator}
              >
                {uploadingCreator ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {characters.length > 0 ? "…or upload a one-off creator photo" : "Upload a creator photo"}
              </Button>

              {creatorUrl && (
                <p className="text-[11px] text-emerald-400 mt-3 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Creator selected
                  {creatorName ? ` — ${creatorName}` : ""}
                </p>
              )}

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!creatorUrl}
                  className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 3 — ANGLE ===== */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold">Pick the ad angle</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Each angle is a proven paid-social hook. Start with Lifestyle hold —
                it's the highest-performing safe default.
              </p>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AD_ANGLES.map((a) => {
                  const selected = angle === a.key;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => setAngle(a.key)}
                      className={`group text-left rounded-xl overflow-hidden border-2 transition-colors ${
                        selected
                          ? "border-[#6366f1]"
                          : "border-transparent hover:border-[#6366f1]/40"
                      }`}
                    >
                      {/* Visual: 9:16 example thumbnail. The angle's
                          example image sits on top of a branded
                          gradient — if the asset isn't dropped in
                          yet (or 404s) the <img> hides itself via
                          onError and the gradient + label show
                          through. Ships now, lights up when the 6
                          example shots land in public/ad-angles/. */}
                      <div
                        className="relative aspect-[9/16] w-full"
                        style={{
                          background:
                            "linear-gradient(150deg,#1e1b3a 0%,#2a1f4d 55%,#15132a 100%)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.exampleImage}
                          alt={`${a.label} ad example`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        {/* Bottom scrim so the label is always
                            readable over either the photo or the
                            gradient fallback. */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3">
                          <p className="text-sm font-semibold leading-tight">{a.label}</p>
                          <p className="text-[11px] text-zinc-300 mt-0.5 line-clamp-2">
                            {a.blurb}
                          </p>
                        </div>
                        {selected && (
                          <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#6366f1] flex items-center justify-center shadow-lg">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={generate}
                  className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Generate ad
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 4 — RESULT ===== */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center">
              {generating ? (
                <div className="py-16">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#a78bfa]" />
                  <p className="text-sm">Compositing {productName || "your product"} into the scene…</p>
                  <p className="text-xs text-muted-foreground mt-1">~15–30 seconds</p>
                </div>
              ) : resultUrl ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-6 w-full md:text-left">
                  <div className="relative shrink-0 mx-auto md:mx-0">
                    {videoUrl ? (
                      <video
                        src={videoUrl}
                        className="aspect-[9/16] w-[300px] rounded-xl object-cover bg-black border border-border"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resultUrl}
                        alt="Generated ad"
                        className="aspect-[9/16] w-[300px] rounded-xl object-cover bg-black border border-border"
                      />
                    )}
                    {animating && (
                      <div className="absolute inset-0 rounded-xl bg-black/65 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#a78bfa] mb-3" />
                        <p className="text-xs">Animating into a video ad…</p>
                        <p className="text-[11px] text-muted-foreground mt-1">~60–90 seconds</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full max-w-sm">
                  <div className="flex gap-3 flex-wrap">
                    <Button asChild variant="outline">
                      <a
                        href={videoUrl || resultUrl}
                        download={videoUrl ? "tavira-ad.mp4" : "tavira-ad.png"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download {videoUrl ? "video" : "image"}
                      </a>
                    </Button>
                    {!videoUrl && (
                      <Button
                        className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
                        onClick={animate}
                        disabled={animating}
                      >
                        {animating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Animating…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" /> Turn into a video ad
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {!videoUrl && !animating && (
                    <p className="text-[11px] text-muted-foreground mt-2 max-w-xs">
                      Like this still? Animate it into a 5s UGC video ad with
                      Seedance — that's what actually runs on TikTok/Meta.
                    </p>
                  )}

                  {/* Premium: talking video ad — only for roster
                      creators (Seedance-2 needs a persona, not a
                      photo). Brand/Agency tier; the API enforces it. */}
                  {creatorUrl && stockCreatorIdFromImage(creatorUrl) && (
                    <div className="mt-6 w-full max-w-sm rounded-xl border border-[#6366f1]/40 bg-[#6366f1]/5 p-4 text-left">
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[#a78bfa]" />
                        Talking video ad
                        <span className="text-[10px] uppercase tracking-wide rounded bg-[#6366f1]/30 px-1.5 py-0.5">
                          Brand · beta
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Your creator says a hook line to camera — with real
                        voice. ~3 min to render.
                      </p>
                      {/* Selected product + creator (Higgsfield-style
                          confirmation of what's in the ad). */}
                      <div className="mt-3 flex items-center gap-2">
                        {productUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={productUrl}
                            alt="Product"
                            className="h-9 w-9 rounded-md object-cover border border-border bg-black"
                          />
                        )}
                        {creatorUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={creatorUrl}
                            alt="Creator"
                            className="h-9 w-9 rounded-md object-cover border border-border bg-black"
                          />
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {creatorName || "Your creator"}
                          {productName ? ` · ${productName}` : ""}
                        </span>
                      </div>
                      {talkingUrl ? (
                        <>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video
                            src={talkingUrl}
                            controls
                            autoPlay
                            loop
                            className="mt-3 w-full rounded-lg border border-border bg-black"
                          />
                          <Button asChild variant="outline" className="mt-3 w-full">
                            <a href={talkingUrl} download="tavira-talking-ad.mp4" target="_blank" rel="noreferrer">
                              Download talking video
                            </a>
                          </Button>
                        </>
                      ) : (
                        <>
                          <textarea
                            value={talkingScript}
                            onChange={(e) => setTalkingScript(e.target.value.slice(0, 240))}
                            placeholder={'e.g. "Okay I had to show you guys this — honestly obsessed, you need it."'}
                            rows={3}
                            disabled={talkingBusy}
                            className="mt-3 w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#6366f1] resize-none"
                          />
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {talkingScript.length}/240
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">Length</span>
                              {([5, 10] as const).map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  disabled={talkingBusy}
                                  onClick={() => setTalkingDuration(d)}
                                  className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                                    talkingDuration === d
                                      ? "border-[#6366f1] bg-[#6366f1]/20 text-white"
                                      : "border-border bg-black/30 text-muted-foreground hover:border-[#6366f1]/60"
                                  }`}
                                >
                                  {d}s
                                </button>
                              ))}
                            </div>
                          </div>
                          <Button
                            className="mt-2 w-full bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
                            onClick={generateTalkingAd}
                            disabled={talkingBusy || !talkingScript.trim()}
                          >
                            {talkingBusy ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Rendering the talking ad…
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate talking video ad
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  </div>
                  </div>

                  <button
                    onClick={resetAll}
                    className="mt-5 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3 w-3" /> Start a new ad
                  </button>
                </>
              ) : (
                <div className="py-16">
                  <p className="text-sm text-muted-foreground">No result yet.</p>
                  <Button variant="ghost" className="mt-3" onClick={() => setStep(3)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to angle
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
