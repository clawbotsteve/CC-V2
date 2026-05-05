"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUserContext } from "@/components/layout/user-context";
import OnboardingQuestionnaire from "@/components/onboard/OnboardingQuestionnaire";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { motion } from "framer-motion";
import { useRef } from "react";
import {
  Sparkles,
  Video,
  Brush,
  WandSparkles,
  Image as ImageIcon,
  Pencil,
  MessageSquare,
  Users,
  ArrowRight,
  Check,
  Play,
  Star,
} from "lucide-react";

const contentExamples = [
  { type: "video", title: "UGC Video Ad", desc: "Scroll-stopping short-form ad creative", src: "/cc-content/video-3.mp4" },
  { type: "beforeAfter", title: "Before / After Upgrade", desc: "Show raw input transformed into premium output", beforeSrc: "/cc-content/before.png", afterSrc: "/cc-content/after.png" },
  { type: "image", title: "Product Marketing", desc: "Branded visuals for ads, promos, and launches", src: "/cc-content/image-2.png" },
  { type: "video", title: "Fashion Reel", desc: "AI model motion clip for beauty + fashion", src: "/cc-content/video-2-landing.mp4" },
  { type: "video", title: "Talking Head", desc: "Direct-to-camera content for offers and updates", src: "/cc-content/talking-head-model1.mp4" },
] as const;

const tools = [
  { emoji: "🧠", name: "Nano Banana Pro", desc: "Best 4K image model ever", href: "/tools/image-generation", badge: "Most Popular", badgeClass: "bg-[#6366f1] text-white", preview: "/cc-content/gen-ugc-1-rev1.png", previewType: "image" },
  { emoji: "🎬", name: "Kling 2.6", desc: "Generate Video", href: "/tools/video-generation", badge: "Most Popular", badgeClass: "bg-red-500/15 text-red-400 border border-red-500/20", preview: "/cc-content/kling-v26-pro.mp4" },
  { emoji: "🎥", name: "Motion Control", desc: "Generate Video", href: "/tools/video-generation", badge: "Most Popular", badgeClass: "bg-[#6366f1]/20 text-[#c4b5fd] border border-[#a78bfa]/30", preview: "/cc-content/MC-video-1.mov" },
  { emoji: "🧬", name: "Soul 2.0", desc: "Identity-locked character system", href: "/tools/influencers", badge: "NEW", badgeClass: "bg-lime-300 text-black", preview: "/cc-content/Soul2.0-image.png", previewType: "image" },
  { emoji: "✨", name: "Face Enhance", desc: "AI skin & facial enhancement", href: "/tools/face-enhance", badge: "Creator", badgeClass: "bg-[#a78bfa]/20 text-[#c4b5fd] border border-[#a78bfa]/30" },
  { emoji: "⬆️", name: "Upscale", desc: "Enhance to 4K resolution", href: "/tools/image-upscale", badge: null },
];

const cameraPresets = [
  "Bullet Time", "Crash Zoom", "360 Orbit", "Dolly In", "Pan Right", "FPV Drone",
  "Crane Up", "Arc Left", "Dutch Angle", "Jib Down", "Steadicam", "Timelapse",
  "Tilt Up", "Whip Pan", "Snorricam", "Zoom Out", "Fisheye", "Hyperlapse",
];

const vfxEffects = [
  { emoji: "💥", name: "Explosion", bg: "linear-gradient(135deg, #7f1d1d, #991b1b)" },
  { emoji: "🌊", name: "Water Bending", bg: "linear-gradient(135deg, #0c4a6e, #0369a1)" },
  { emoji: "🌿", name: "Nature Bloom", bg: "linear-gradient(135deg, #365314, #4d7c0f)" },
  { emoji: "🔮", name: "Disintegration", bg: "linear-gradient(135deg, #581c87, #7e22ce)" },
  { emoji: "⚡", name: "Thunder God", bg: "linear-gradient(135deg, #713f12, #a16207)" },
  { emoji: "🌀", name: "Portal", bg: "linear-gradient(135deg, #1e1b4b, #3730a3)" },
  { emoji: "🌸", name: "Sakura Petals", bg: "linear-gradient(135deg, #831843, #be185d)" },
  { emoji: "🧊", name: "Freezing", bg: "linear-gradient(135deg, #064e3b, #059669)" },
  { emoji: "💀", name: "Smoke Transition", bg: "linear-gradient(135deg, #1c1917, #57534e)" },
  { emoji: "🤖", name: "Cyborg", bg: "linear-gradient(135deg, #312e81, #4338ca)" },
];

const modelCloud = [
  { name: "GPT Image 2", sub: "Image Model" },
  { name: "Nano Banana 2", sub: "Image Model" },
  { name: "Soul 2.0", sub: "Character Lock" },
  { name: "Kling 2.6", sub: "Video Model" },
  { name: "Motion Control", sub: "Camera Control" },
];

const modelCloudLoop = [...modelCloud, ...modelCloud];

// Plan capability source-of-truth (revised 2026-05-01) — keep in sync with
// lib/plan-access.ts and app/pricing/page.tsx. Marketing copy reflects
// what each tier actually unlocks server-side.
const pricingPlans = [
  {
    name: "Free",
    hook: "Try the magic first",
    price: "$0",
    credits: "2 credits/month",
    featured: false,
    cta: "Try Free",
    features: [
      "1 medium-quality GPT Image 2 generation",
      "Text-to-image only",
      "No credit card required",
    ],
    modelAccess: ["GPT Image 2 (medium)"],
    unlimited: [],
  },
  {
    name: "Beginner",
    hook: "All image tools, no video",
    price: "$9.99",
    credits: "80 credits/month",
    featured: false,
    cta: "Start Beginner",
    features: [
      "All 4 image generation models",
      "Up to 2K resolution",
      "GPT Image 2 (medium quality)",
      "Prompt tools included",
    ],
    modelAccess: [
      "GPT Image 2 (medium)",
      "Nano Banana 2 (1K + 2K)",
      "Nano Banana 2 Edit (1K + 2K)",
      "Flux LoRA",
    ],
    unlimited: [],
  },
  {
    name: "Starter",
    hook: "Add video + 4K image quality",
    price: "$19.99",
    credits: "200 credits/month",
    featured: false,
    cta: "Start Starter",
    features: [
      "Everything in Beginner — no quality caps",
      "GPT Image 2 high quality + 4K Nano Banana",
      "Kling 2.6 video (5s + 10s)",
      "1 AI influencer slot",
    ],
    modelAccess: [
      "All Beginner models, no caps",
      "Kling 2.6",
      "Topaz Upscale",
    ],
    unlimited: [],
  },
  {
    name: "Creator",
    hook: "Power features for character builders",
    price: "$49.99",
    // First-month coupon is real (Stripe coupon, Duration: Once). Mirror in
    // app/pricing/page.tsx — both pages share the same source of truth here.
    firstMonthDiscountPct: 20,
    credits: "600 credits/month",
    featured: true,
    cta: "Build Characters",
    features: [
      "Everything in Starter",
      "Soul 2.0 character lock",
      "Kling Motion Control",
      "Seedance 2.0 reference-to-video",
      "3 AI influencer slots + priority queue",
    ],
    modelAccess: [
      "Soul 2.0",
      "Kling Motion Control",
      "Seedance 2.0 ref-to-video",
      "SeedVR Image Upscale",
    ],
    unlimited: [],
  },
  {
    name: "Studio",
    hook: "For agencies and operators at scale",
    price: "$149.99",
    firstMonthDiscountPct: 31,
    credits: "2,000 credits/month",
    featured: false,
    cta: "Scale with Studio",
    features: [
      "Everything in Creator",
      "10 AI influencer slots",
      "Highest credit allowance",
      "Highest priority queue",
    ],
    modelAccess: ["All Creator models, no caps"],
    unlimited: [],
  },
];

const toolComparisonRows = [
  { tool: "Image Generation (Nano Banana Pro)", free: true, starter: true, creator: true, studio: true },
  { tool: "Prompt Gen / Optimizer", free: false, starter: true, creator: true, studio: true },
  { tool: "Face Enhance", free: false, starter: true, creator: true, studio: true },
  { tool: "Image Editor + Upscaler", free: false, starter: true, creator: true, studio: true },
  { tool: "Face Swap", free: false, starter: true, creator: true, studio: true },
  { tool: "Lipsync (Text-to-Video)", free: false, starter: true, creator: true, studio: true },
  { tool: "Video Gen 5s (Kling / Wan)", free: false, starter: true, creator: true, studio: true },
  { tool: "Kling Motion Control", free: false, starter: true, creator: true, studio: true },
  { tool: "Avatar to Video (5s)", free: false, starter: true, creator: true, studio: true },
  { tool: "Lipsync (Audio-to-Video)", free: false, starter: false, creator: true, studio: true },
  { tool: "UGC Factory (Talking Head)", free: false, starter: false, creator: true, studio: true },
  { tool: "Video Gen 10s", free: false, starter: false, creator: true, studio: true },
  { tool: "Soul ID / LoRA Training", free: false, starter: false, creator: true, studio: true },
  { tool: "Veo HQ 4s / 8s", free: false, starter: false, creator: false, studio: true },
  { tool: "Click to Ad Pipeline", free: false, starter: false, creator: false, studio: true },
  { tool: "API Access", free: false, starter: false, creator: false, studio: true },
  { tool: "White-label Export", free: false, starter: false, creator: false, studio: true },
];

// Per-plan accent palette. Backgrounds use a very faint top-of-card tint
// fading to the page bg; the glow color is reserved for the Featured plan's
// outline ring only. Keeps each tier visually distinct without making the
// cards feel like loud, spotlit panels.
const planStyles: Record<string, { card: string; glow: string; save: string }> = {
  Free: {
    card: "linear-gradient(180deg, rgba(148,163,184,0.06) 0%, rgba(17,17,24,0) 65%)",
    glow: "rgba(148,163,184,0.25)",
    save: "No commitment",
  },
  Beginner: {
    card: "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(17,17,24,0) 65%)",
    glow: "rgba(59,130,246,0.35)",
    save: "Best first paid step",
  },
  Starter: {
    card: "linear-gradient(180deg, rgba(56,189,248,0.08) 0%, rgba(17,17,24,0) 65%)",
    glow: "rgba(56,189,248,0.35)",
    save: "Best for first 30 days",
  },
  Creator: {
    card: "linear-gradient(180deg, rgba(163,230,53,0.10) 0%, rgba(17,17,24,0) 65%)",
    glow: "rgba(163,230,53,0.40)",
    save: "Most creators choose this",
  },
  Studio: {
    card: "linear-gradient(180deg, rgba(244,114,182,0.10) 0%, rgba(17,17,24,0) 65%)",
    glow: "rgba(244,114,182,0.38)",
    save: "Built for serious scale",
  },
};

export default function DashboardPage() {
  const toolsScrollRef = useRef<HTMLDivElement | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const [pricingBilling, setPricingBilling] = useState<"monthly" | "threeMonths">("monthly");

  // Onboarding flow: triggered by the "Create Your First Image" CTA.
  // First-time users (firstVisit === true on the user-info /me payload) get
  // the personalization questionnaire; returning users skip straight to the
  // tool. The questionnaire's POST /api/onboarding/complete flips firstVisit
  // → false, so the second click bypasses the modal.
  const router = useRouter();
  const { meta } = useUserContext();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const handleCreateFirstImage = () => {
    if (meta?.firstVisit) {
      setOnboardingOpen(true);
    } else {
      router.push("/tools/image-generation?model=gpt-image-2");
    }
  };

  const scrollToolsRight = () => {
    toolsScrollRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  };

  const scrollContentLeft = () => {
    contentScrollRef.current?.scrollBy({ left: -520, behavior: "smooth" });
  };

  const scrollContentRight = () => {
    contentScrollRef.current?.scrollBy({ left: 520, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden py-20 md:py-24 text-center px-6">
        {/* Glow — uses inset-0 + percentage-based radial so it always fades to
            fully transparent before hitting any section edge. Replaces the
            previous fixed 800×600 box that got clipped by overflow-hidden,
            producing a hard purple cut-off line at the top + sides. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 50% 25%, rgba(99,102,241,0.18) 0%, rgba(167,139,250,0.07) 45%, transparent 75%)',
          }}
        />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 max-w-[800px] mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-full px-4 py-1.5 text-sm font-medium text-[#818cf8] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
            Powered by GPT Image 2, Nano Banana 2 & Soul 2.0
          </div>

          <div className="mb-5">
            <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              This is where you build
            </h1>
            <TypingAnimation
              text="your AI influencer."
              duration={90}
              className="font-display text-center text-5xl md:text-7xl font-extrabold leading-[1.05] bg-gradient-to-r from-[#6366f1] to-[#a78bfa] bg-clip-text text-transparent"
            />
          </div>

          <p className="text-lg text-muted-foreground max-w-[560px] mx-auto mb-9 leading-relaxed">
            Build AI influencers that post, grow, and generate income — without you lifting a finger
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              type="button"
              onClick={handleCreateFirstImage}
              className="relative overflow-hidden inline-flex items-center gap-3 rounded-xl border-[3px] border-black bg-[#6d57ff] px-5 py-2.5 text-[16px] tracking-[0.07em] text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
              style={{ boxShadow: "0 8px 28px rgba(109,87,255,0.35)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              <GlowingEffect disabled={false} proximity={80} spread={36} borderWidth={2} />
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#5b43ff] text-2xl font-bold leading-none">
                ›
              </span>
              <span className="uppercase">Create Your First Image</span>
            </button>
          </div>

          <OnboardingQuestionnaire
            open={onboardingOpen}
            onClose={() => setOnboardingOpen(false)}
          />

          {/* Capability strip — replaces the previous fabricated user-count
              stats. Sourced from real product capabilities so we don't ship
              made-up "50K+ creators" numbers for a brand-new product. */}
          <div className="flex gap-10 justify-center mt-12 pt-8 border-t border-border flex-wrap">
            {[
              { num: "5", label: "AI Models", color: "#818cf8" },
              { num: "4K", label: "Max Resolution" },
              { num: "10s", label: "Video Length", color: "#a78bfa" },
              { num: "1-Click", label: "Character Lock" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl md:text-3xl font-bold" style={s.color ? { color: s.color } : {}}>{s.num}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== MODEL CLOUD =====
          Previously wrapped in a bordered card with a hardcoded dark gradient
          bg, which read as a separate panel sitting on top of the page rather
          than part of it. Removed the card entirely; edges now fade with a CSS
          mask (transparency, not a solid color) so the marquee blends into
          whatever page bg is behind it. */}
      <section className="max-w-[1280px] mx-auto px-6 py-10">
        <div className="mb-5 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Models we use</p>
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
          }}
        >
          <div className="flex w-max items-center gap-3 animate-[model-marquee_26s_linear_infinite] hover:[animation-play-state:paused]">
            {modelCloudLoop.map((model, idx) => (
              <div
                key={`${model.name}-${idx}`}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center min-w-[170px]"
              >
                <p className="text-sm font-semibold text-white">{model.name}</p>
                <p className="text-[11px] text-zinc-400">{model.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTENT EXAMPLES ===== */}
      <section className="max-w-[1920px] mx-auto px-2 md:px-6 pb-24 pt-4">
        <div className="mb-8 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white">The New Era of Content Creation</h2>
          <p className="mt-5 text-base md:text-xl font-semibold text-zinc-200">AI is changing how stories are created — faster, more visual, and more personal.</p>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Previous examples"
            onClick={scrollContentLeft}
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80 md:inline-flex"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>

          <button
            type="button"
            aria-label="Next examples"
            onClick={scrollContentRight}
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80 md:inline-flex"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          <div ref={contentScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar px-1 md:px-10 snap-x snap-mandatory">
            {contentExamples.map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ y: -4 }}
                className="relative snap-start min-w-[92vw] sm:min-w-[70vw] lg:min-w-[44vw] xl:min-w-[36vw] rounded-2xl overflow-hidden border border-border hover:border-[#6366f1] transition-all"
                style={{ aspectRatio: "16 / 9" }}
              >
                <GlowingEffect disabled={false} proximity={72} spread={32} borderWidth={2} />
                <div className="relative h-full w-full bg-black/60">
                  {item.type === "image" ? (
                    <Image src={item.src} alt={item.title} fill className="object-contain" />
                  ) : item.type === "beforeAfter" ? (
                    <div className="grid h-full w-full grid-cols-2">
                      <div className="relative h-full">
                        <Image src={item.beforeSrc} alt={`${item.title} before`} fill className="object-contain" />
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">Before</span>
                      </div>
                      <div className="relative h-full">
                        <Image src={item.afterSrc} alt={`${item.title} after`} fill className="object-contain" />
                        <span className="absolute right-2 top-2 rounded bg-indigo-600/80 px-2 py-0.5 text-[10px] font-semibold text-white">After</span>
                      </div>
                    </div>
                  ) : (
                    <video src={item.src} className="h-full w-full object-contain" autoPlay muted loop playsInline />
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOOLS GRID =====
          Removed the wrapping purple-tinted card — the inner tool cards
          already have their own borders/glows/imagery, so the outer card
          just produced a heavy panel-on-panel effect. Section now sits
          flush against the page background. */}
      <section className="w-full px-4 md:px-6 py-20">
        <div className="w-full">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="lg:w-[280px] lg:pr-2">
              <h2 className="font-display text-4xl font-black uppercase leading-[1.02] tracking-tight text-white">
                What will you <span className="text-[#8b7bff]">create today?</span>
              </h2>
              <p className="mt-4 text-sm text-zinc-300">Video generation</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b7bff] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}
                >
                  Explore all tools <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={scrollToolsRight}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10"
                >
                  More <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar px-1" ref={toolsScrollRef}>
              <div className="flex min-w-max gap-4 snap-x snap-mandatory">
                {tools.map((tool) => (
                  <Link key={tool.name} href={tool.href}>
                    <motion.div whileHover={{ y: -2 }} className={`group relative snap-start h-[300px] ${("cardClass" in tool ? (tool as any).cardClass : undefined) || "w-[82vw] sm:w-[420px]"} overflow-hidden rounded-2xl border border-white/10 bg-[#111118] transition-all hover:border-[#6366f1]`}>
                      <GlowingEffect disabled={false} proximity={70} spread={28} borderWidth={2} />
                      {tool.preview ? (
                        tool.previewType === "image" ? (
                          <Image src={tool.preview} alt={tool.name} fill className={tool.name === "Soul 2.0" ? "object-contain bg-black/20" : "object-cover"} />
                        ) : (
                          <video src={tool.preview} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
                        )
                      ) : (
                        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(167,139,250,0.12))" }} />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

                      {tool.badge && (
                        <span className={`absolute right-3 top-3 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tool.badgeClass}`}>
                          {tool.badge}
                        </span>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                        <div className="text-[24px] font-semibold text-white">{tool.name}</div>
                        <div className="mt-1 text-sm text-zinc-200">{tool.desc}</div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ADDITIONAL VIDEO SHOWCASE ===== */}
      <section className="max-w-[1280px] mx-auto px-6 pb-10">
        <div className="mb-5 text-center">
          <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">The New Era of Content Creation</h3>
          <p className="mt-2 text-sm md:text-base text-zinc-300">AI is changing how stories are created — faster, more visual, and more personal.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            "/cc-content/video-4.mp4",
            "/cc-content/video-5.mp4",
            "/cc-content/video-6.mp4",
            "/cc-content/video-7.mp4",
            "/cc-content/video-8.mp4",
          ].map((src, idx) => (
            <div key={src} className="rounded-2xl overflow-hidden border border-white/10 bg-[#111118]">
              <div className="relative bg-black/40" style={{ aspectRatio: "4 / 5" }}>
                <video className="h-full w-full object-cover" src={src} autoPlay muted loop playsInline disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback" />
              </div>
              <></>
            </div>
          ))}
        </div>
      </section>

      {false && <section className="max-w-[1280px] mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["/cc-content/model-6.jpeg", "/cc-content/model-7.jpeg", "/cc-content/model-8.png"].map((src, idx) => (
            <div key={src} className="relative rounded-2xl border border-[#8b7bff]/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,123,255,0.08))] p-3">
              <GlowingEffect disabled={false} proximity={68} spread={30} borderWidth={2} />
              <div className="relative h-64 w-full rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <Image src={src} alt={`Soul 2.0 sample ${idx + 1}`} fill className="object-contain" />
              </div>
            </div>
          ))}
        </div>
      </section>}

      {/* ===== BATCH GENERATION OFFER (ROUGH) ===== */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="rounded-3xl border border-[#6366f1]/25 bg-[linear-gradient(140deg,#111118_0%,#15132a_50%,#111118_100%)] p-6 md:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b7bff]">Batch Generation</p>
              <h3 className="mt-3 font-display text-3xl md:text-4xl font-black tracking-tight text-white">
                Generate 50+ variations of your influencer
              </h3>
              <p className="mt-4 text-base text-zinc-300">
                Launch full content sets in one run — multiple outfits, locations, angles, and moods while keeping a consistent identity.
              </p>
              <p className="mt-3 text-sm text-zinc-400">
                Every batch request is reviewed for legal + policy compliance before activation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="mailto:team@taviralabs.ai?subject=Batch%20Generation%20Request"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b7bff] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Request Batch Generation
                </a>
                <Link
                  href="/batch-onboarding"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  Start Guided Onboarding
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 md:max-w-[420px] md:justify-end">
              {[
                "50+ outputs",
                "Consistent character",
                "Multi-scene looks",
                "Ready for ads + socials",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ADDITIONAL VIDEO SHOWCASE (moved below content section) ===== */}
      {false && <section className="max-w-[1280px] mx-auto px-6 pb-8">
        <div className="mb-5">
          <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">More generated video examples</h3>
          <p className="mt-2 text-sm text-zinc-400">Recent outputs from the TraviaLabs workflow.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "/cc-content/video-4.mp4",
            "/cc-content/video-5.mp4",
            "/cc-content/video-6.mp4",
            "/cc-content/video-7.mp4",
            "/cc-content/video-8.mp4",
          ].map((src, idx) => (
            <div key={src} className="rounded-2xl border border-white/10 bg-[#111118] p-2">
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40" style={{ aspectRatio: "9 / 16" }}>
                <video
                  className="h-full w-full object-cover"
                  src={src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate noremoteplayback"
                />
              </div>
              <p className="px-1 pt-2 text-xs text-zinc-400">Video sample {idx + 4}</p>
            </div>
          ))}
        </div>
      </section>}

      {/* ===== CREATOR WORKFLOWS ===== */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Built for real creator workflows</h2>
          <p className="mt-2 text-sm md:text-base text-zinc-400">From one idea to a full week of content — in one dashboard.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Image to Campaign",
              desc: "Generate hero images, resize, and export ad-ready assets in minutes.",
            },
            {
              title: "Character Consistency",
              desc: "Train once, then create multiple scenes while keeping the same look.",
            },
            {
              title: "Video at Scale",
              desc: "Turn concepts into short-form videos with Kling and motion tools.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-[#111118] p-6 hover:border-[#6366f1]/60 transition-all">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="max-w-[1280px] mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-2">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-[15px]">Start free. Scale as you create.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-sm">
            <button
              type="button"
              onClick={() => setPricingBilling("monthly")}
              className={`rounded-full px-3 py-1 transition-colors ${pricingBilling === "monthly" ? "bg-white/20 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPricingBilling("threeMonths")}
              className={`rounded-full px-3 py-1 transition-colors ${pricingBilling === "threeMonths" ? "bg-white/20 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              3-Months
            </button>
            <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-bold text-white">20% OFF</span>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {pricingBilling === "threeMonths"
              ? "3-Month plans save 20% vs paying monthly."
              : ""}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {pricingPlans.map((plan) => {
            const basePrice = Number.parseFloat(plan.price.replace("$", ""));

            // First-month coupon (real Stripe coupon, Duration: Once) for
            // Creator + Studio. Source of truth lives on the plan object
            // — see firstMonthDiscountPct in the pricingPlans definitions
            // above.
            const firstMonthPct =
              pricingBilling === "monthly"
                ? (plan as any).firstMonthDiscountPct as number | undefined
                : undefined;
            const firstMonthPrice =
              firstMonthPct !== undefined
                ? Number((basePrice * (1 - firstMonthPct / 100)).toFixed(2))
                : null;

            // Display price = monthly base, or 20%-off for 3-month plans,
            // or first-month coupon price when applicable.
            const displayPrice =
              pricingBilling === "threeMonths" && plan.name !== "Free"
                ? `$${(basePrice * 0.8).toFixed(2)}`
                : firstMonthPrice !== null
                  ? `$${firstMonthPrice.toFixed(2)}`
                  : plan.price;

            return (
            <div
              key={plan.name}
              className={`relative flex flex-col border rounded-[20px] p-5 transition-all hover:-translate-y-1 ${plan.featured ? 'border-lime-300/60' : 'border-white/10 hover:border-white/20'}`}
              style={{
                // Cards now sit on the page bg with a subtle accent tint at
                // the top instead of a hard color block. Featured (Creator)
                // keeps a soft inset ring; other tiers use just the border.
                background: planStyles[plan.name].card,
                boxShadow: plan.featured
                  ? `0 0 0 1px ${planStyles[plan.name].glow} inset, 0 4px 18px rgba(0,0,0,0.20)`
                  : `0 4px 18px rgba(0,0,0,0.18)`,
              }}
            >
              {/* Most Popular pill floats above the featured card. The save
                  badge below is in normal flow so it can't collide with this
                  pill (previous version had both as `absolute` and they
                  overlapped on the Creator card). */}
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full text-black bg-lime-300 shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Hide the save badge on the Featured card — its "MOST
                  POPULAR" pill above already serves as the callout, and
                  rendering both produced two near-identical "MOST..." badges
                  stacked on top of each other. */}
              {!plan.featured && (
                <div className="inline-flex self-start items-center rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-3">
                  {planStyles[plan.name].save}
                </div>
              )}

              <div className="font-display text-xl font-bold mb-1">{plan.name}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#d8ccff] mb-2">{plan.hook}</div>
              {firstMonthPct !== undefined && firstMonthPrice !== null && (
                <div className="text-[11px] text-zinc-300 mb-1">
                  <span className="line-through text-zinc-400">{plan.price}/mo</span>{" "}
                  <span className="text-pink-300">{firstMonthPct}% off 1st month</span>
                </div>
              )}
              <div className="font-display text-4xl font-extrabold tracking-tight mb-1">{displayPrice}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              {firstMonthPct !== undefined && firstMonthPrice !== null && (
                <div className="text-[11px] text-zinc-300 mb-1">First month ${firstMonthPrice.toFixed(2)}, then {plan.price}/mo</div>
              )}
              <div className="text-sm font-semibold text-lime-300 mb-5">{plan.credits}</div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-[#22c55e] flex-none mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Models included — dropped the redundant per-row "FULL ACCESS"
                  pills (the section header already conveys that). Names can
                  now use the full card width without wrapping behind a pill. */}
              <div className="mb-4 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Models included</div>
                <ul className="space-y-1.5">
                  {plan.modelAccess.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-sm text-zinc-200">
                      <Check className="h-3.5 w-3.5 text-lime-300 flex-none mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Only render the Unlimited Access section when there's
                  actually something to list — otherwise we ship an orphaned
                  heading with no content underneath. */}
              {plan.unlimited.length > 0 && (
                <div className="mb-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Unlimited Access</div>
                  <ul className="space-y-1.5">
                    {plan.unlimited.map((u) => (
                      <li key={u} className="text-sm text-zinc-300">• {u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Push CTA to the bottom of the card so all CTAs align across
                  the row regardless of how much content sits above them. */}
              <div className="mt-auto" />

              <Link
                href="/pricing"
                className={`block w-full text-center py-3 rounded-[10px] text-sm font-semibold transition-all ${plan.featured ? 'text-black bg-lime-300 hover:bg-lime-200' : 'text-white border border-white/25 bg-white/5 hover:bg-white/10'}`}
              >
                {plan.cta}
              </Link>
            </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#0f1018] p-4 md:p-6">
          <h3 className="font-display text-xl md:text-2xl font-bold mb-4">Plan comparison: what you get</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[2.6fr_repeat(4,1fr)] gap-2 px-2 py-2 text-xs uppercase tracking-wider text-zinc-400">
                <div>Tool</div><div className="text-center">Free</div><div className="text-center">Starter</div><div className="text-center">Creator</div><div className="text-center">Studio</div>
              </div>
              {toolComparisonRows.map((row) => (
                <div key={row.tool} className="grid grid-cols-[2.6fr_repeat(4,1fr)] gap-2 items-center border-t border-white/10 px-2 py-3 text-sm">
                  <div className="text-zinc-200">{row.tool}</div>
                  <div className="text-center">{row.free ? "✓" : "—"}</div>
                  <div className="text-center">{row.starter ? "✓" : "—"}</div>
                  <div className="text-center">{row.creator ? "✓" : "—"}</div>
                  <div className="text-center">{row.studio ? "✓" : "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER =====
          Was a solid purple billboard (linear-gradient(#6366f1 → #a78bfa))
          that read as a foreign element on the dark page. Replaced with a
          near-black base + a contained purple radial glow behind the
          headline — same pattern as the hero, so the whole page reads as
          one continuous surface. */}
      <section className="max-w-[1280px] mx-auto px-6 pb-20">
        <div
          className="relative rounded-3xl overflow-hidden text-center py-16 px-12 border border-white/10"
          style={{ background: '#0d0e14' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(99,102,241,0.22) 0%, rgba(167,139,250,0.08) 45%, transparent 75%)',
            }}
          />
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-3 relative z-10 text-white">Ready to create?</h2>
          <p className="text-base text-zinc-300 mb-7 relative z-10">Generate stunning AI images, videos, and influencers — all in one TraviaLabs dashboard.</p>
          <Link
            href="/tools/image-generation"
            className="inline-block bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white px-9 py-3.5 rounded-xl text-[15px] font-bold hover:-translate-y-0.5 transition-all relative z-10"
            style={{ boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
          >
            Start Creating Free
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes model-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ===== FOOTER =====
          Removed the marketing-style 4-column footer (Product/Features/Company/
          Resources) — every link in it was an `href="#"` placeholder pointing
          nowhere ("API Docs", "Tutorials", "Cookie Notice", etc.). It also
          duplicated the Terms / Privacy / Acceptable Use links that already
          live in the global thin compliance bar in `app/(dashboard)/layout.tsx`,
          which appears on every dashboard route. Two stacked footers with a
          mostly-broken nav looked worse than no footer at all; the thin bar
          handles all required legal links uniformly across the dashboard. */}
    </div>
  );
}
