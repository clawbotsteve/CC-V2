"use client";

import { useEffect, useRef } from "react";
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
    <>
      {/* ============================================================
          MOBILE HERO (<md) — clean text-first.
          The Multiverse cinematic image is fundamentally a wide-format
          composition (4 floating windows fanned across a 16:9 frame).
          Compressing it into a phone viewport makes the windows
          shrink to thumbnails, the badge wraps awkwardly, and the
          full-width CTA covers most of the actual hero. So mobile
          gets its own layout: gradient headline + tagline + CTA.
          Same pattern PR #43 used for the cycling-text mobile fallback.
          ============================================================ */}
      <MobileHero onPrimaryCta={onPrimaryCta} ctaHref={ctaHref} />

      {/* ============================================================
          DESKTOP HERO (md+) — the cinematic Multiverse Window.
          ============================================================ */}
      <DesktopHero onPrimaryCta={onPrimaryCta} ctaHref={ctaHref} />
    </>
  );
}

function MobileHero({ onPrimaryCta, ctaHref }: HeroMultiverseProps) {
  return (
    <section className="md:hidden relative w-full overflow-hidden bg-black px-6 py-10">
      {/* Glow behind the headline — same purple radial pattern used on
          the rest of the dashboard so mobile and desktop share a
          visual identity even though the layouts diverge. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(99,102,241,0.20) 0%, rgba(167,139,250,0.06) 45%, transparent 75%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-full px-3 py-1 text-[11px] font-medium text-[#818cf8] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 [animation:pulse-dot_2s_ease-in-out_infinite]" />
          Powered by GPT Image 2 · Nano Banana 2
        </div>

        {/* Headline + gradient phrase. Static (no scramble) on mobile —
            cycling animations have been historically flaky on mobile
            WebKit, and the static gradient phrase reads instantly.
            Pivot 2026-05-23 → Stance A: body copy now mirrors the
            desktop "one face / every niche / every platform" frame so
            the message is consistent between viewports. */}
        <h1 className="font-display text-4xl font-extrabold tracking-tight leading-[1.05] text-foreground">
          This is where you build
        </h1>
        <h1 className="font-display text-4xl font-extrabold tracking-tight leading-[1.05] mt-1">
          <span className="bg-gradient-to-r from-[#6366f1] to-[#a78bfa] bg-clip-text text-transparent">
            your AI influencer.
          </span>
        </h1>

        <p className="text-sm text-muted-foreground mt-5 max-w-[320px] leading-relaxed">
          One face. Every niche. Every platform. Train a consistent character, generate unlimited content, grow your audience anywhere.
        </p>

        <div className="mt-7 w-full max-w-[320px]">
          {ctaHref ? (
            <Link href={ctaHref} className="hero-cta hero-cta--mobile">
              <span>START BUILDING</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPrimaryCta}
              className="hero-cta hero-cta--mobile"
            >
              <span>START BUILDING</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Capability strip — moved INTO the mobile hero so the order
            of stats follows naturally below the CTA without an awkward
            empty band between sections. Desktop has a separate strip
            below the cinematic hero. */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-5 mt-10 pt-6 border-t border-border w-full max-w-[320px]">
          {[
            { num: "5", label: "AI Models", color: "#818cf8" },
            { num: "4K", label: "Max Resolution" },
            { num: "10s", label: "Video Length", color: "#a78bfa" },
            { num: "1-Click", label: "Character Lock" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl font-bold" style={s.color ? { color: s.color } : {}}>
                {s.num}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DesktopHero({ onPrimaryCta, ctaHref }: HeroMultiverseProps) {
  return (
    <section className="hidden md:block relative w-full overflow-hidden bg-black">
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
      {/* Aspect-ratio-locked again. The earlier full-viewport
          (calc(100vh - 56px) + object-cover + Ken Burns scale)
          produced ugly horizontal cropping that ate the baked
          headline on the left edge. Anchoring back to 1920×1072
          shows the entire video cleanly with no cropping games. */}
      <div className="relative w-full" style={{ aspectRatio: "1920 / 1072" }}>
        {/*
          2026-06-03: switched from static hero-multiverse.jpg to an
          autoplay looping MP4 (Tavira-Hero.mp4). The old JPG had
          headline / tagline / CTA copy baked into pixels which was
          impossible to update without re-rendering the asset and
          required a near-opaque blackout band to hide. New video
          has NO baked text — the entire HTML overlay below (Tavira*
          headline, subhead, CTA, trust marks) is the single source
          of truth for the message.
          - autoPlay + muted + loop + playsInline = autoplays inline
            on iOS Safari too (which requires `muted` AND `playsInline`).
          - preload="auto" tradeoff: ~10MB upfront on first paint, but
            metadata-only would mean a black flash before playback
            kicks in. The hero is the page's most important visual;
            eat the bandwidth.
          - poster attribute kept (the old JPG) so a frame shows
            INSTANTLY before the video first paints, esp. on slower
            connections.
        */}
        <video
          src="/hero/Tavira-Hero.mp4"
          poster="/hero/hero-multiverse.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          aria-label="Tavira — your AI influencer creator. Cinematic intro showcasing AI characters across niches."
        />

        {/* Bottom gradient — soft fade for legibility of the
            overlay headline + CTA only. The video has no baked-in
            text to cover, so this is just typographic contrast,
            NOT the heavy blackout the old JPG needed. Height 28%,
            transparent at top so the cityscape blends naturally. */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "28%",
            background:
              "linear-gradient(to top, rgba(8,8,12,0.85) 0%, rgba(8,8,12,0.55) 50%, rgba(8,8,12,0.2) 85%, rgba(8,8,12,0) 100%)",
          }}
        />

        {/* Subtle vignette + slow breathe — barely perceptible. */}
        <div
          className="absolute inset-0 pointer-events-none [animation:hero-vignette-breathe_12s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* Drifting dust-mote particles via canvas. */}
        <HeroParticles />

        {/* ===== Top-center badge ===== */}
        <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 z-10">
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/15 rounded-full px-3 md:px-4 py-1 md:py-1.5 text-[11px] md:text-sm font-medium text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 [animation:pulse-dot_2s_ease-in-out_infinite]" />
            <span className="hidden sm:inline">Powered by GPT Image 2 · Nano Banana 2 · Soul 2.0</span>
            <span className="sm:hidden">GPT Image 2 · Nano Banana 2 · Soul 2.0</span>
          </div>
        </div>

        {/* ===== Lower-left: HTML headline + tagline (single source of truth) =====
            Pivot 2026-05-23 → Stance A (AI influencer creator platform):
            Brand-forward "Tavira" stays huge. Subhead changed from a
            cute italic "your AI influencer" tagline to an action verb
            ("Build your AI influencer") that maps the brand to what
            the visitor came here to do. Body copy drops the LoRA
            jargon and the asterisk footnote-without-a-footnote, and
            broadens "what you can do with this" to include every
            downstream platform a course-graduate might post on. */}
        <div className="absolute bottom-[6%] md:bottom-[8%] left-[4%] md:left-[5%] lg:left-[6%] z-10 max-w-[60%] md:max-w-[55%] lg:max-w-[55%]">
          <h1 className="font-display font-bold leading-[0.92] tracking-tight text-[#f5f0e6]">
            <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-9xl">
              Tavira<span className="text-[#a78bfa]">*</span>
            </span>
          </h1>
          <p className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl text-[#f5f0e6] mt-2 md:mt-3 font-semibold tracking-tight">
            This is where you build your AI influencer.
          </p>
          <p className="text-[10px] sm:text-xs md:text-sm text-white/75 mt-2 md:mt-3 max-w-md leading-relaxed">
            <span className="font-semibold text-white/90">One face. Every niche. Every platform.</span>
            <span className="block sm:inline sm:ml-1">Train a consistent character, generate unlimited content, grow your audience anywhere.</span>
          </p>
        </div>

        {/* ===== Lower-right: brand-purple CTA + trust marks ===== */}
        <div className="absolute bottom-[6%] md:bottom-[8%] right-[4%] md:right-[5%] lg:right-[6%] z-10 flex flex-col items-end gap-2 md:gap-3">
          {ctaHref ? (
            <Link href={ctaHref} className="hero-cta">
              <span>START BUILDING</span>
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
            </Link>
          ) : (
            <button type="button" onClick={onPrimaryCta} className="hero-cta">
              <span>START BUILDING</span>
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          )}

          <div className="hidden md:flex items-center gap-4 lg:gap-7 text-[9px] lg:text-[11px] text-white/80 uppercase tracking-[0.18em]">
            <TrustMark icon={<ScanFace className="h-3.5 w-3.5 text-[#a78bfa]" />} top="Consistent" bottom="Identity" />
            <TrustMark icon={<LayoutGrid className="h-3.5 w-3.5 text-[#a78bfa]" />} top="Multi-Niche" bottom="Content" />
            <TrustMark icon={<TrendingUp className="h-3.5 w-3.5 text-[#a78bfa]" />} top="Built For" bottom="Growth" />
          </div>
        </div>
      </div>

      {/* All keyframes + the .hero-cta button styling colocated so the
          component is self-contained — drop it anywhere and it works. */}
      <style jsx>{`
        /* Ken Burns dropped — at 1920×1072 the scale(1.05) was the
           direct cause of horizontal cropping that ate the headline.
           Image stays still now; motion comes from the particles +
           vignette breathe + CTA pulse. */
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
        /* Primary hero CTA — brand purple gradient (matches the
           dashboard's #6366f1 → #a78bfa accents elsewhere on the
           site so the button reads as the canonical "do the thing"
           color). Sized roughly 35-50% larger than the previous
           amber/transparent version: heavier padding, bigger font,
           bolder weight, more letter-spacing — should be the most
           visually arresting element after the four character windows.
           Glow halo is pure purple now (no gold tinting) so it
           coheres with the rest of the marketing surface. */
        :global(.hero-cta) {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.75rem;
          border: 0;
          border-radius: 0.875rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b7bff 50%, #a78bfa 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.08) inset,
            0 8px 24px rgba(99, 102, 241, 0.45),
            0 16px 48px rgba(139, 123, 255, 0.35);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
          cursor: pointer;
          /* Subtle ambient pulse on the halo so it reads as "live"
             without being noisy. 4s loop, low-amplitude. */
          animation: hero-cta-pulse 4s ease-in-out infinite;
        }
        :global(.hero-cta:hover) {
          transform: translateY(-2px);
          filter: brightness(1.08);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.14) inset,
            0 12px 32px rgba(99, 102, 241, 0.6),
            0 22px 60px rgba(139, 123, 255, 0.5);
        }
        :global(.hero-cta:active) {
          transform: translateY(0);
        }
        /* Mobile CTA: full width of its 320px container, centered
           contents. Pads scale slightly smaller than desktop. */
        :global(.hero-cta--mobile) {
          width: 100%;
          justify-content: center;
          padding: 0.95rem 1.25rem;
          font-size: 0.875rem;
          letter-spacing: 0.14em;
        }
        @keyframes hero-cta-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.08) inset,
              0 8px 24px rgba(99, 102, 241, 0.45),
              0 16px 48px rgba(139, 123, 255, 0.35);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.14) inset,
              0 10px 30px rgba(99, 102, 241, 0.6),
              0 20px 56px rgba(139, 123, 255, 0.5);
          }
        }
        @media (min-width: 768px) {
          :global(.hero-cta) {
            padding: 1.25rem 2.25rem;
            font-size: 1.1rem;
            gap: 0.875rem;
            border-radius: 1rem;
          }
        }
        @media (min-width: 1024px) {
          :global(.hero-cta) {
            padding: 1.4rem 2.6rem;
            font-size: 1.2rem;
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
        <div className="font-semibold text-white/95">{top}</div>
        <div className="text-white/60">{bottom}</div>
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
