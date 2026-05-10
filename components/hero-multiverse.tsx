"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ScanFace, LayoutGrid, TrendingUp } from "lucide-react";

/**
 * Multiverse hero — full-bleed cinematic hero for the dashboard.
 *
 * Pitch encoded in the image: solo creator on a hilltop with their
 * laptop, four floating holographic windows around them showing the
 * SAME AI character in four different niches (Fitness Coach, Fashion
 * Model, Podcast Host, Lifestyle Creator). The viewer's brain locks
 * onto "wait, that's the same person" — which is the LoRA-consistency
 * pitch in a single image.
 *
 * Why static image + CSS/canvas motion (not a video):
 *   - The four character faces in the floating windows MUST stay
 *     identical across frames. Image-to-video models corrupt them.
 *   - 263 KB JPEG vs. 5-15 MB video — 50× lighter, kinder on mobile.
 *   - The "alive" feeling comes from surrounding motion, not subject
 *     motion. Same trick Linear / Apple / Anthropic use.
 *
 * Motion sources, all CSS/canvas (no video file):
 *   - Slow Ken Burns zoom on the hero image (24s loop)
 *   - Particle dust motes drifting upward across the scene
 *   - Subtle vignette breathe to add scene depth
 *
 * Text + CTA are rendered as real HTML over the image, NOT baked in,
 * so they stay crisp at any scale and remain accessible / SEO-able.
 */

interface HeroMultiverseProps {
  onPrimaryCta?: () => void;
  /** Override CTA target. Default kicks the existing onboarding flow. */
  ctaHref?: string;
}

export function HeroMultiverse({ onPrimaryCta, ctaHref }: HeroMultiverseProps) {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* ===== Image stage =====
          Sized to fill the visible viewport BELOW the top navbar (~56px).
          On wide / ultra-wide displays the 1920×1072 image gets scaled
          UP to fill the height, with the bottom-center focal point
          (creator + lower windows) preserved via object-position.
          On portrait/mobile, the image gets cropped horizontally —
          object-position keeps the creator centered.

          Switched from aspect-ratio-locked (which left black bars
          above/below on tall viewports) to min-h-[calc(100vh-56px)]
          so the hero is genuinely above-the-fold no matter the screen.
          Keeps a min-height of 600px so the layout doesn't collapse
          on weird short browser windows. */}
      <div
        className="relative w-full"
        style={{ height: "calc(100vh - 56px)", minHeight: "600px" }}
      >
        {/* Ken Burns wrap — slow zoom-in/out so the static image
            breathes. Pure CSS keyframes, no JS, no extra assets. */}
        <div className="absolute inset-0 [animation:hero-kenburns_28s_ease-in-out_infinite]">
          <Image
            src="/hero/hero-multiverse.jpg"
            alt="Travia — your AI influencer. A solo creator on a hilltop with their laptop, surrounded by floating holographic windows each showing the same AI character in a different scene: fitness coach, fashion model, podcast host, lifestyle creator."
            fill
            priority
            sizes="100vw"
            className="object-cover"
            // Bias the crop toward the lower-center: keeps the creator
            // and the lower row of floating windows in frame on
            // ultra-wide and portrait viewports where the image gets
            // letterboxed by object-cover.
            style={{ objectPosition: "50% 65%" }}
          />
        </div>

        {/* Bottom-half darkening gradient — gives the headline + CTA
            enough contrast against the cityscape without graying out
            the upper sky / floating windows. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0) 75%)",
          }}
        />

        {/* Subtle vignette + slow breathe — barely perceptible but
            adds depth and a "scene is alive" cue. */}
        <div
          className="absolute inset-0 pointer-events-none [animation:hero-vignette-breathe_12s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        {/* Drifting dust-mote particles via canvas. ~40 motes drifting
            upward — implies the scene is generating something. */}
        <HeroParticles />

        {/* ===== Top-center badge ===== */}
        <div className="absolute top-6 md:top-10 left-1/2 -translate-x-1/2 z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 text-xs md:text-sm font-medium text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 [animation:pulse-dot_2s_ease-in-out_infinite]" />
            Powered by GPT Image 2 · Nano Banana 2 · Soul 2.0
          </div>
        </div>

        {/* ===== Lower-left: headline + tagline ===== */}
        <div className="absolute bottom-6 md:bottom-12 lg:bottom-16 left-4 md:left-10 lg:left-16 z-10 max-w-[68%] md:max-w-[55%] lg:max-w-[50%]">
          <h1 className="font-display font-bold leading-[0.92] tracking-tight text-[#f5f0e6]">
            <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[10rem]">
              Travia
              {/* Asterisk picks up a soft amber-gold glow — same accent
                  as the CTA border so the brand mark + CTA share a
                  color story. */}
              <span className="text-[#f5b664]">*</span>
            </span>
          </h1>
          <p className="font-display italic text-base sm:text-xl md:text-2xl lg:text-3xl text-[#f5f0e6]/95 mt-1 md:mt-2">
            your AI influencer
            <span className="text-[#f5b664] not-italic">*</span>
          </p>
          <p className="text-xs sm:text-sm md:text-base text-white/70 mt-3 md:mt-4 max-w-md">
            <span className="font-semibold text-white/85">One face. Infinite possibilities.</span>
            <span className="block sm:inline sm:ml-1">Built with consistency. Powered by LoRA.</span>
          </p>
        </div>

        {/* ===== Lower-right: CTA + trust marks ===== */}
        <div className="absolute bottom-6 md:bottom-12 lg:bottom-16 right-4 md:right-10 lg:right-16 z-10 flex flex-col items-end gap-3 md:gap-5">
          {ctaHref ? (
            <Link href={ctaHref} className="hero-cta">
              <span>CREATE YOUR AI INFLUENCER</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button type="button" onClick={onPrimaryCta} className="hero-cta">
              <span>CREATE YOUR AI INFLUENCER</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {/* Three trust marks — mirrors the "consistent identity ·
              multi-niche · built for growth" pitch baked into the
              image's window labels. Hidden on smaller screens where
              the headline is the priority. */}
          <div className="hidden md:flex items-center gap-5 lg:gap-8 text-[10px] lg:text-xs text-white/75 uppercase tracking-[0.18em]">
            <TrustMark icon={<ScanFace className="h-3.5 w-3.5 text-[#f5b664]" />} top="Consistent" bottom="Identity" />
            <TrustMark icon={<LayoutGrid className="h-3.5 w-3.5 text-[#f5b664]" />} top="Multi-Niche" bottom="Content" />
            <TrustMark icon={<TrendingUp className="h-3.5 w-3.5 text-[#f5b664]" />} top="Built For" bottom="Growth" />
          </div>
        </div>
      </div>

      {/* All keyframes + the .hero-cta button styling colocated so the
          component is self-contained — drop it anywhere and it works. */}
      <style jsx>{`
        @keyframes hero-kenburns {
          0%, 100% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.05) translate(-1%, -0.5%);
          }
        }
        @keyframes hero-vignette-breathe {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
      <style jsx global>{`
        :global(.hero-cta) {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.7rem 1.25rem;
          border: 1.5px solid rgba(245, 182, 100, 0.65);
          border-radius: 0.625rem;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          color: #f5f0e6;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          box-shadow: 0 8px 30px rgba(245, 182, 100, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.18s ease;
          cursor: pointer;
        }
        :global(.hero-cta:hover) {
          border-color: rgba(245, 182, 100, 0.95);
          background: rgba(245, 182, 100, 0.12);
          transform: translateY(-1px);
          box-shadow: 0 12px 40px rgba(245, 182, 100, 0.4);
        }
        @media (min-width: 768px) {
          :global(.hero-cta) {
            padding: 0.95rem 1.6rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </section>
  );
}

function TrustMark({
  icon,
  top,
  bottom,
}: {
  icon: React.ReactNode;
  top: string;
  bottom: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="leading-tight">
        <div className="font-semibold text-white/90">{top}</div>
        <div className="text-white/55">{bottom}</div>
      </div>
    </div>
  );
}

/**
 * 40-particle dust-mote canvas. Runs at ~30fps, ~0.5% CPU on a modern
 * laptop. Pauses when the tab is hidden so it doesn't drain battery.
 */
function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Array<{ x: number; y: number; vy: number; vx: number; size: number; opacity: number }> = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-spawn on resize so density stays consistent across breakpoints.
      const count = Math.min(50, Math.max(20, Math.round(canvas.offsetWidth / 40)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vy: -0.15 - Math.random() * 0.45,
        vx: (Math.random() - 0.5) * 0.1,
        size: 0.8 + Math.random() * 1.8,
        opacity: 0.15 + Math.random() * 0.45,
      }));
    };
    resize();

    let lastTime = 0;
    const tick = (now: number) => {
      // ~30fps cap — particles don't need 60fps, saves battery.
      if (now - lastTime < 33) {
        raf = requestAnimationFrame(tick);
        return;
      }
      lastTime = now;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        // Wrap to bottom when they drift off the top.
        if (p.y < -10) {
          p.y = canvas.offsetHeight + 10;
          p.x = Math.random() * canvas.offsetWidth;
        }
        if (p.x < -10 || p.x > canvas.offsetWidth + 10) {
          p.x = Math.random() * canvas.offsetWidth;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Warm gold tint to match the sunset palette.
        ctx.fillStyle = `rgba(255, 215, 165, ${p.opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
    />
  );
}
