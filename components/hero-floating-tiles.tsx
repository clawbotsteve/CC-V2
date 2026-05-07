"use client";

import NextImage from "next/image";
import { motion } from "framer-motion";

/**
 * Decorative floating tiles for the dashboard hero. Renders 6 small AI-
 * character thumbnails positioned absolutely around the headline area
 * (3 on the left, 3 on the right), with subtle floating animation, slight
 * rotation per tile, and staggered fade-in on mount.
 *
 * Goals:
 *   - Add visual life to the hero (the page used to be empty black space
 *     with a tagline that promised AI characters but showed none)
 *   - Demonstrate range — multiple characters in different scenes
 *   - Stay decorative — never overlap with the central headline column at
 *     any common viewport. Headline column is `max-w-[800px] mx-auto`;
 *     these tiles live OUTSIDE that column on either side
 *   - Hide cleanly on mobile where there's no room (md: breakpoint and up)
 *
 * Asset selection: all 6 tiles are photoreal AI characters / lifestyle
 * shots. Text-heavy assets (magazine covers, product ads, posters) are
 * deliberately excluded — at thumbnail size their typography becomes
 * unreadable noise and dilutes the "characters" message.
 */

interface FloatingTile {
  src: string;
  alt: string;
  /** "image" renders <Image>, "video" renders an autoplaying muted
   *  <video>. Default "image". */
  type?: "image" | "video";
  /** Tailwind position classes for the tile container. */
  positionClass: string;
  /** Width of the tile in pixels. Different per tile so the wall feels
   *  hand-arranged rather than gridded. */
  width: number;
  /** Aspect ratio CSS string, e.g. "9 / 16". */
  aspect: string;
  /** Initial rotation in degrees. */
  rotate: number;
  /** Animation delay (seconds) so tiles fade in staggered. */
  delay: number;
  /** Float animation duration (seconds) — different per tile so they
   *  don't bob in sync. */
  floatDuration: number;
}

const TILES: FloatingTile[] = [
  // ── LEFT side — 3 tiles, top to bottom ──
  // Top tiles start at 18% (below the "Powered by" badge area which sits
  // around 5-12%) so they decorate the headline without colliding with
  // copy. Positions are tuned for the typical hero height (~720-800px).
  {
    src: "/cc-content/T-3.jpg",
    alt: "AI character in Manhattan penthouse at blue hour",
    positionClass: "top-[18%] left-[2%] lg:left-[5%]",
    width: 120,
    aspect: "1 / 1",
    rotate: -7,
    delay: 0.1,
    floatDuration: 7,
  },
  {
    src: "/cc-content/T-7.jpg",
    alt: "VEIDA — Slow Wire single artwork",
    positionClass: "top-[48%] left-[0%] lg:left-[2%]",
    width: 110,
    aspect: "1 / 1",
    rotate: 9,
    delay: 0.4,
    floatDuration: 9,
  },
  {
    src: "/cc-content/T-2.jpg",
    alt: "AI character at Bali infinity pool",
    positionClass: "bottom-[6%] left-[4%] lg:left-[7%]",
    width: 100,
    aspect: "9 / 16",
    rotate: -5,
    delay: 0.7,
    floatDuration: 8,
  },

  // ── RIGHT side — 3 tiles, top to bottom ──
  // All right-side tiles are now M-X assets (user's curated set, 2 videos
  // + 1 image). All vertical 9:16 aspect, so the right column reads as a
  // unified "real character output" stack.
  {
    src: "/cc-content/M-1.mp4",
    alt: "AI character lifestyle video",
    type: "video",
    positionClass: "top-[18%] right-[2%] lg:right-[5%]",
    width: 110,
    aspect: "9 / 16",
    rotate: 6,
    delay: 0.2,
    floatDuration: 8.5,
  },
  {
    src: "/cc-content/M-2.mp4",
    alt: "AI character lifestyle video",
    type: "video",
    positionClass: "top-[46%] right-[0%] lg:right-[2%]",
    width: 105,
    aspect: "9 / 16",
    rotate: -8,
    delay: 0.5,
    floatDuration: 7.5,
  },
  {
    src: "/cc-content/M-3.jpg",
    alt: "AI character lifestyle portrait",
    positionClass: "bottom-[8%] right-[4%] lg:right-[7%]",
    width: 100,
    aspect: "9 / 16",
    rotate: 11,
    delay: 0.8,
    floatDuration: 9.5,
  },
];

export function HeroFloatingTiles() {
  return (
    <>
      {/* All 6 tiles sit absolute to the hero <section>; the hero is
          relatively-positioned and overflow-hidden, so tiles never escape
          the section bounds even on tall viewports. Hidden below md:
          breakpoint where there's no horizontal room for them. */}
      {TILES.map((tile, i) => (
        <motion.div
          key={tile.src + i}
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: tile.delay,
            ease: "easeOut",
          }}
          className={`pointer-events-none absolute z-0 hidden md:block ${tile.positionClass}`}
          style={{
            width: `${tile.width}px`,
            transform: `rotate(${tile.rotate}deg)`,
          }}
        >
          {/* Inner wrapper handles the gentle bobbing animation —
              keeping the rotate on the parent and the float on the child
              avoids having them fight each other. */}
          <div
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#111118] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            style={{
              aspectRatio: tile.aspect,
              animation: `hero-tile-float ${tile.floatDuration}s ease-in-out infinite`,
              animationDelay: `${tile.delay}s`,
            }}
          >
            {tile.type === "video" ? (
              <video
                src={tile.src}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                controlsList="nodownload noplaybackrate noremoteplayback"
              />
            ) : (
              <NextImage
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="150px"
                className="object-cover"
                priority={i < 2}
              />
            )}
          </div>
        </motion.div>
      ))}

      <style jsx global>{`
        @keyframes hero-tile-float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </>
  );
}
