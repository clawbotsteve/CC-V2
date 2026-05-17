"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Upload, Loader2, ArrowRight, Package, UserRound } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/page-container";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { Button } from "@/components/ui/button";
import { uploadFiles } from "@/lib/utils";
import { AD_ANGLES, AdAngleKey } from "@/lib/ad-studio/ad-angles";

/**
 * Ad Studio MVP (Pivot PR 2).
 *
 * The product-first flow that repositions Tavira for ecom: upload
 * your product → pick a consistent AI creator → get a believable
 * UGC ad shot with the product composited in.
 *
 * MVP = ONE sample to validate the loop. The 20-variant batch is
 * Pivot PR 3 (the "fire your UGC agency" demo) — its CTA is stubbed
 * here so the flow reads end-to-end.
 */

type CSCharacter = {
  id: string;
  name: string;
  characterStudioRef?: string | null;
  avatarImageUrl?: string | null;
};

export default function AdStudioPage() {
  // Product
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const productInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState(false);

  // Creator
  const [characters, setCharacters] = useState<CSCharacter[]>([]);
  const [creatorUrl, setCreatorUrl] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const creatorInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingCreator, setUploadingCreator] = useState(false);

  // Angle + generation
  const [angle, setAngle] = useState<AdAngleKey>("lifestyle_hold");
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Pull the user's Character Studio creators for the picker — the
  // whole pitch is "consistent creator," so trained characters are
  // the primary path; uploading a one-off photo is the fallback.
  useEffect(() => {
    fetch("/api/character-studio")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.characters)) {
          setCharacters(
            d.characters.filter((c: CSCharacter) => c.characterStudioRef || c.avatarImageUrl),
          );
        }
      })
      .catch(() => {});
  }, []);

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
          toast.error("Generation failed — try a different angle or image.");
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const canGenerate = !!productUrl && !!creatorUrl && !generating;

  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResultUrl(null);
    setJobId(null);
    try {
      const res = await fetch("/api/ad-studio/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorImageUrl: creatorUrl,
          productImageUrl: productUrl,
          angle,
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
      setJobId(data.jobId);
      pollResult(data.jobId);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
      setGenerating(false);
    }
  };

  return (
    <PageContainer scrollable>
      <div className="w-full p-4 md:p-8">
        <div className="py-4 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between border-b border-foreground/40">
          <AiAnimatedHeading
            heading="Ad Studio"
            description="Upload your product. Pick an AI creator. Get scroll-stopping UGC ad creative — no agency, no shoot."
            icon={<Sparkles className="h-6 w-6" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 pt-8">
          {/* ===== Left: the 3-step setup ===== */}
          <div className="space-y-5">
            {/* Step 1 — product */}
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-[#a78bfa]" /> 1 · Your product
              </p>
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
              {productUrl ? (
                <div className="relative aspect-square w-32 rounded-lg overflow-hidden bg-black">
                  <Image src={productUrl} alt="Product" fill className="object-cover" sizes="128px" />
                </div>
              ) : (
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
              )}
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name (optional, e.g. 'PR-1 vitamin C serum')"
                className="mt-3 w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </div>

            {/* Step 2 — creator */}
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                <UserRound className="h-4 w-4 text-[#a78bfa]" /> 2 · Your AI creator
              </p>
              {characters.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground mb-2">
                    Pick a trained creator (stays consistent across every ad):
                  </p>
                  <div className="flex gap-2 flex-wrap mb-3">
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
                          }}
                          className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 ${
                            selected ? "border-[#6366f1]" : "border-transparent"
                          }`}
                          title={c.name}
                        >
                          {ref && (
                            <Image src={ref} alt={c.name} fill className="object-cover" sizes="64px" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
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
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => creatorInputRef.current?.click()}
                disabled={uploadingCreator}
              >
                {uploadingCreator ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {characters.length > 0 ? "…or upload a creator photo" : "Upload a creator photo"}
              </Button>
              {creatorUrl && (
                <p className="text-xs text-emerald-400 mt-2">✓ Creator selected</p>
              )}
              {characters.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: build a reusable creator in{" "}
                  <Link href="/tools/character-studio" className="text-[#a78bfa] underline">
                    Character Studio
                  </Link>{" "}
                  so it stays identical across every ad.
                </p>
              )}
            </div>

            {/* Step 3 — angle */}
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-sm font-semibold mb-3">3 · Ad angle</p>
              <div className="grid grid-cols-2 gap-2">
                {AD_ANGLES.map((a) => {
                  const selected = angle === a.key;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => setAngle(a.key)}
                      className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                        selected
                          ? "border-[#6366f1] bg-[#6366f1]/15"
                          : "border-border bg-card/40 hover:border-[#6366f1]/40"
                      }`}
                    >
                      <p className="text-sm font-medium">{a.label}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {a.blurb}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={!canGenerate}
              className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white h-11"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating your ad…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate ad
                </>
              )}
            </Button>
          </div>

          {/* ===== Right: result ===== */}
          <div className="rounded-2xl border border-border bg-card/40 p-6 flex items-center justify-center min-h-[480px]">
            {resultUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative aspect-[9/16] w-[300px] rounded-xl overflow-hidden bg-black">
                  <Image src={resultUrl} alt="Generated ad" fill className="object-cover" sizes="300px" />
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="outline">
                    <a href={resultUrl} download="tavira-ad.png" target="_blank" rel="noreferrer">
                      Download
                    </a>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
                    onClick={() =>
                      toast.info("20-variant batch is coming in the next release — this is the MVP single-shot.")
                    }
                  >
                    Generate 20 variants <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm text-center">
                  Like the creator + product fusion? The next release turns this one shot into
                  20 ad variants across hooks & formats in one click.
                </p>
              </div>
            ) : generating ? (
              <div className="text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                <p className="text-sm">Compositing your product into the creator's scene…</p>
                <p className="text-xs mt-1">~15–30 seconds</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground max-w-sm">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  Upload a product, pick a creator, choose an angle, and your first
                  AI UGC ad shows up here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
