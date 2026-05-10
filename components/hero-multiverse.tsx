"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

        {/*
          IMPORTANT — current hero image has the headline ("Travia*"),
          italic tagline, "One face. Infinite possibilities..." subhead,
          three trust marks, and the "Powered by GPT Image 2..." badge
          all BAKED INTO THE PIXELS. So we deliberately do NOT render
          HTML overlays for those — they'd double-stack on top of the
          baked text and look broken.

          The ONE HTML overlay we keep is the CTA, positioned to sit
          directly over (and cover) the baked amber "CREATE YOUR AI
          INFLUENCER" button. The HTML CTA is in brand purple, larger
          and bolder, with a darkening backdrop behind it so any pixel
          peek-through from the baked button is suppressed.

          When/if the hero image is regenerated WITHOUT baked text,
          re-enable the headline + trust marks blocks below this.
        */}

        {/* ===== HTML CTA only — covers the baked amber button ===== */}
        <div className="absolute bottom-[6%] md:bottom-[8%] right-[3%] md:right-[5%] lg:right-[6%] z-10 flex flex-col items-end gap-3">
          {/* Dark blurred backdrop sized to the CTA + a bit of padding,
              so any baked-button pixels around the edges of our HTML
              button get blurred away. Behind the CTA in the stack. */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[1.25rem] bg-black/45 backdrop-blur-md"
            />
            {ctaHref ? (
              <Link href={ctaHref} className="hero-cta relative">
                <span>GENERATE YOUR FIRST IMAGE</span>
                <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onPrimaryCta}
                className="hero-cta relative"
              >
                <span>GENERATE YOUR FIRST IMAGE</span>
                <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            )}
          </div>
        </div>

        {/* === Disabled overlays — re-enable when hero image has no
              baked text. Keeping the JSX colocated so the next
              non-baked image swap is a one-line guard flip. ===

          <div className="absolute top-6 md:top-10 left-1/2 -translate-x-1/2 z-10">
            ... badge ...
          </div>

          <div className="absolute bottom-6 md:bottom-12 lg:bottom-16 left-4 md:left-10 lg:left-16 z-10 max-w-[68%] md:max-w-[55%] lg:max-w-[50%]">
            ... headline + tagline ...
          </div>

          <div className="hidden md:flex items-center gap-5 lg:gap-8 ...">
            ... trust marks ...
          </div>
        */}
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

// TrustMark + the badge component are intentionally not exported —
// they're disabled until the hero image is regenerated without baked
// text. JSX shells are kept commented in the main component above so
// the re-enable is a single-block flip.

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
