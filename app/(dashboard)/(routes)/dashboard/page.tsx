"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  { emoji: "✨", name: "Face Enhance", desc: "AI skin & facial enhancement", href: "/tools/face-enhance", badge: "Pro", badgeClass: "bg-[#a78bfa]/20 text-[#c4b5fd] border border-[#a78bfa]/30" },
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

const pricingPlans = [
  {
    name: "Free",
    hook: "Try the magic first",
    price: "$0",
    credits: "5 credits/month",
    featured: false,
    cta: "Try Free",
    features: ["5 Nano Banana Pro images", "Watermarked output", "Signup required"],
    modelAccess: ["Nano Banana Pro (limited)"],
    unlimited: ["—"],
  },
  {
    name: "Starter",
    hook: "Get moving fast",
    price: "$29.95",
    credits: "300 credits/month",
    featured: false,
    cta: "Start Starter",
    features: ["24h trial (50 credits)", "Nano Banana Pro + Nano Banana 2 + Kling 2.6 + Topaz Upscale", "Prompt tools included", "✕ Motion Control / Veo / premium upscale"],
    modelAccess: ["Kling 2.6", "Nano Banana Pro", "Nano Banana 2", "Topaz Upscale"],
    unlimited: ["Image generations (fair use)", "Prompt optimizer"],
  },
  {
    name: "Creator",
    hook: "Best plan for AI character builders",
    price: "$69.99",
    credits: "650 credits/month",
    featured: true,
    cta: "Build Characters",
    features: ["Everything in Starter", "Motion Control + Nano Banana 2 Edit + all Upscale", "Full edit suite"],
    modelAccess: ["Kling Motion Control", "SeedVR Upscale", "Video Upscale", "Nano Banana 2 Edit"],
    unlimited: ["Image generations (fair use)", "Prompt optimizer", "Character consistency sessions"],
  },
  {
    name: "Studio",
    hook: "For agencies and operators",
    price: "$129.99",
    credits: "1,500 credits/month",
    featured: false,
    cta: "Scale with Studio",
    features: ["Everything in Creator", "Veo 3.1 access", "API access", "White-label exports"],
    modelAccess: ["All Creator models", "Veo HQ 4s / 8s", "Click-to-Ad pipeline"],
    unlimited: ["Image generations (fair use)", "Prompt optimizer", "Priority render queue"],
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

const planStyles: Record<string, { card: string; glow: string; save: string }> = {
  Free: {
    card: "linear-gradient(180deg, rgba(40,44,62,0.75) 0%, rgba(17,17,24,1) 45%)",
    glow: "rgba(148,163,184,0.25)",
    save: "No commitment",
  },
  Starter: {
    card: "linear-gradient(180deg, rgba(12,74,110,0.65) 0%, rgba(17,17,24,1) 50%)",
    glow: "rgba(56,189,248,0.35)",
    save: "Best for first 30 days",
  },
  Creator: {
    card: "linear-gradient(180deg, rgba(70,95,20,0.72) 0%, rgba(17,17,24,1) 52%)",
    glow: "rgba(163,230,53,0.40)",
    save: "Most creators choose this",
  },
  Studio: {
    card: "linear-gradient(180deg, rgba(131,24,67,0.72) 0%, rgba(17,17,24,1) 52%)",
    glow: "rgba(244,114,182,0.38)",
    save: "Built for serious scale",
  },
};

export default function DashboardPage() {
  const toolsScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToolsRight = () => {
    toolsScrollRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden py-20 md:py-24 text-center px-6">
        {/* Glow */}
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, rgba(167,139,250,0.08) 40%, transparent 70%)' }} />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 max-w-[800px] mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-full px-4 py-1.5 text-sm font-medium text-[#818cf8] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
            Powered by Flux Pro, Kling 3.0 & Veo 3
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5">
            This is where you build <br />
            <span className="bg-gradient-to-r from-[#6366f1] to-[#a78bfa] bg-clip-text text-transparent">your AI influencer.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-[560px] mx-auto mb-9 leading-relaxed">
            Build AI influencers that post, grow, and generate income — without you lifting a finger
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/tools/image-generation"
              className="inline-flex items-center gap-3 rounded-xl border-[3px] border-black bg-[#6d57ff] px-5 py-2.5 text-[16px] tracking-[0.07em] text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
              style={{ boxShadow: "0 8px 28px rgba(109,87,255,0.35)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#5b43ff] text-2xl font-bold leading-none">
                ›
              </span>
              <span className="uppercase">Create Your First Image</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 justify-center mt-12 pt-8 border-t border-border flex-wrap">
            {[
              { num: "50K+", label: "Creators", color: "#818cf8" },
              { num: "2M+", label: "Images Generated" },
              { num: "500K+", label: "Videos Created", color: "#a78bfa" },
              { num: "10+", label: "AI Models" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl md:text-3xl font-bold" style={s.color ? { color: s.color } : {}}>{s.num}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== CONTENT EXAMPLES ===== */}
      <section className="max-w-[1280px] mx-auto px-6 pb-24 pt-8">
        <div className="mb-8 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white">The New Era of Content Creation</h2>
          <p className="mt-5 text-base md:text-xl font-semibold text-zinc-200">AI is changing how stories are created — faster, more visual, and more personal.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {contentExamples.map((item) => (
            <motion.div key={item.title} whileHover={{ y: -4 }} className="relative rounded-2xl overflow-hidden border border-border hover:border-[#6366f1] transition-all" style={{ aspectRatio: '4/5' }}>
              <div className="relative h-full w-full">
                {item.type === "image" ? (
                  <Image src={item.src} alt={item.title} fill className="object-cover" />
                ) : item.type === "beforeAfter" ? (
                  <div className="grid h-full w-full grid-cols-2">
                    <div className="relative h-full">
                      <Image src={item.beforeSrc} alt={`${item.title} before`} fill className="object-cover" />
                      <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">Before</span>
                    </div>
                    <div className="relative h-full">
                      <Image src={item.afterSrc} alt={`${item.title} after`} fill className="object-cover" />
                      <span className="absolute right-2 top-2 rounded bg-indigo-600/80 px-2 py-0.5 text-[10px] font-semibold text-white">After</span>
                    </div>
                  </div>
                ) : (
                  <video src={item.src} className="h-full w-full object-cover" autoPlay muted loop playsInline />
                )}
              </div>
              {/* no copy on cards */}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TOOLS GRID ===== */}
      <section className="w-full px-4 md:px-6 py-24">
        <div className="rounded-3xl border border-[#6366f1]/25 bg-[linear-gradient(130deg,#111118_0%,#171332_42%,#111118_100%)] p-4 md:p-6 w-full">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="lg:w-[320px] lg:pr-2">
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

            <div className="flex-1 overflow-x-auto no-scrollbar" ref={toolsScrollRef}>
              <div className="flex min-w-max gap-4">
                {tools.map((tool) => (
                  <Link key={tool.name} href={tool.href}>
                    <motion.div whileHover={{ y: -2 }} className={`group relative h-[260px] ${("cardClass" in tool ? (tool as any).cardClass : undefined) || "w-[220px]"} overflow-hidden rounded-2xl border border-white/10 bg-[#111118] transition-all hover:border-[#6366f1]`}>
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

      <section className="max-w-[1280px] mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["/cc-content/Soul2.0-image-1.png", "/cc-content/Soul2.0-image-2.png", "/cc-content/Soul2.0-image-3.png"].map((src, idx) => (
            <div key={src} className="rounded-2xl border border-[#8b7bff]/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,123,255,0.08))] p-3">
              <div className="relative h-64 w-full rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <Image src={src} alt={`Soul 2.0 sample ${idx + 1}`} fill className="object-contain" />
              </div>
            </div>
          ))}
        </div>
      </section>

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
          <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm">
            <span className="text-zinc-400">Monthly</span>
            <span className="inline-flex h-6 w-11 items-center rounded-full bg-zinc-700 px-1">
              <span className="h-4 w-4 rounded-full bg-white" />
            </span>
            <span className="font-semibold text-white">Annual</span>
            <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-bold text-white">20% OFF</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative border rounded-[20px] p-8 transition-all hover:-translate-y-1 ${plan.featured ? 'border-lime-300/70' : 'border-white/15 hover:border-white/30'}`}
              style={{
                background: planStyles[plan.name].card,
                boxShadow: `0 0 0 1px ${planStyles[plan.name].glow} inset, 0 10px 30px rgba(0,0,0,0.35)`,
              }}
            >
              <div className="absolute left-4 top-3 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                {planStyles[plan.name].save}
              </div>
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full text-black bg-lime-300">Most Popular</div>
              )}
              <div className="font-display text-xl font-bold mb-1 mt-4">{plan.name}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#d8ccff] mb-2">{plan.hook}</div>
              <div className="font-display text-4xl font-extrabold tracking-tight mb-1">{plan.price}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              <div className="text-sm font-semibold text-lime-300 mb-6">{plan.credits}</div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-[#22c55e] flex-none" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mb-4 rounded-xl border border-white/15 bg-black/20 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-2">Full access to best models</div>
                <div className="space-y-1.5">
                  {plan.modelAccess.map((m) => (
                    <div key={m} className="flex items-center justify-between text-sm text-zinc-200">
                      <span>{m}</span>
                      <span className="rounded-md bg-lime-300/90 px-2 py-0.5 text-[10px] font-bold text-black">FULL ACCESS</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-2">Unlimited Access</div>
                <div className="space-y-1.5">
                  {plan.unlimited.map((u) => (
                    <div key={u} className="text-sm text-zinc-300">• {u}</div>
                  ))}
                </div>
              </div>

              <Link
                href="/settings"
                className={`block w-full text-center py-3 rounded-[10px] text-sm font-semibold transition-all ${plan.featured ? 'text-black bg-lime-300 hover:bg-lime-200' : 'text-white border border-white/25 bg-white/5 hover:bg-white/10'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
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

      {/* ===== CTA BANNER ===== */}
      <section className="max-w-[1280px] mx-auto px-6 pb-20">
        <div className="relative rounded-3xl overflow-hidden text-center py-16 px-12" style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
          <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1), transparent 60%)' }} />
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-3 relative z-10">Ready to create?</h2>
          <p className="text-base opacity-85 mb-7 relative z-10">Join 50,000+ creators using Tavira Labs to generate stunning AI content every day.</p>
          <Link href="/tools/image-generation" className="inline-block bg-white text-[#6366f1] px-9 py-3.5 rounded-xl text-[15px] font-bold hover:-translate-y-0.5 transition-all relative z-10" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            Start Creating Free
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border max-w-[1280px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="ft-lg" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#c084fc"/>
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="20" stroke="url(#ft-lg)" strokeWidth="1.5" fill="none" opacity="0.3"/>
                <circle cx="24" cy="24" r="12" stroke="url(#ft-lg)" strokeWidth="1.5" fill="none" opacity="0.5"/>
                <circle cx="24" cy="24" r="5" fill="url(#ft-lg)"/>
                <line x1="24" y1="4" x2="24" y2="12" stroke="url(#ft-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                <line x1="24" y1="36" x2="24" y2="44" stroke="url(#ft-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                <line x1="4" y1="24" x2="12" y2="24" stroke="url(#ft-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                <line x1="36" y1="24" x2="44" y2="24" stroke="url(#ft-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              </svg>
              <span className="font-display font-bold text-lg">Tavira Labs</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">AI Content Creation Platform. Generate professional photos, videos, and AI influencers with cutting-edge models.</p>
          </div>
          {[
            { title: "Product", links: ["Create Image", "Create Video", "AI Influencer", "Face Swap", "Upscale"] },
            { title: "Features", links: ["Camera Presets", "Visual Effects", "Prompt Generator", "Face Enhance", "Image Editor"] },
            { title: "Company", links: ["About", "Pricing", "Blog", "Contact"] },
            { title: "Resources", links: ["Tutorials", "API Docs", "Community", "Support", "Discord"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4">{col.title}</h4>
              <div className="space-y-1">
                {col.links.map((link) => (
                  <a key={link} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5">{link}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-border text-xs text-[#55556a] gap-2">
          <span>© 2026 Tavira Labs. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-muted-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-muted-foreground">Terms of Use</a>
            <a href="#" className="hover:text-muted-foreground">Cookie Notice</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
