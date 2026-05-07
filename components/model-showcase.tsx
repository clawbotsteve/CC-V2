"use client";

import Link from "next/link";
import NextImage from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Higgsfield-style "Meet [Model]" showcase section adapted to TraviaLabs'
 * visual identity (deep-navy card, purple accents, branded CTA).
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  [BADGE]                  [Masonry demo grid]    │
 *   │                           [tile][tile][tile]     │
 *   │  Meet [Model]             [tile][tile][tile]     │
 *   │  Tagline goes here...     [tile][tile][tile]     │
 *   │                                                   │
 *   │  [Try [Model] →]          [View all examples →]  │
 *   └──────────────────────────────────────────────────┘
 *
 * Reusable across "Meet GPT Image 2", "Meet Soul 2.0", etc. by passing
 * different `tiles` and metadata.
 */

export interface ShowcaseTile {
  /** File path under /public/, e.g. "/cc-content/gpt2-showcase/01-x.png" */
  src: string;
  /** "image" or "video". Determines whether we render <Image> or <video>. */
  type: "image" | "video";
  /** Native aspect ratio of the asset, used to size the masonry tile. */
  aspectRatio: "16/9" | "9/16" | "4/5" | "1/1";
  /** Accessible label. */
  alt: string;
}

interface ModelShowcaseProps {
  /** Small uppercase label above the title — e.g. "NEW MODEL", "FEATURED". */
  badge: string;
  /** Big bold title — e.g. "Meet GPT Image 2". */
  title: string;
  /** One-line value prop under the title. */
  subtitle: string;
  /** Primary CTA label — e.g. "Try GPT Image 2". */
  ctaText: string;
  /** Where the primary CTA goes. Should pre-select the model in the picker. */
  ctaHref: string;
  /** Demo tiles for the masonry grid. 8-12 looks best. */
  tiles: ShowcaseTile[];
  /** Optional secondary "view all" link, shown bottom-right. */
  viewAllText?: string;
  viewAllHref?: string;
}

export function ModelShowcase({
  badge,
  title,
  subtitle,
  ctaText,
  ctaHref,
  tiles,
  viewAllText,
  viewAllHref,
}: ModelShowcaseProps) {
  // Container is intentionally wider than the rest of the page (which
  // sits at max-w-[1280px]) so the masonry has room to fan out across
  // 4 columns at xl: instead of 3, cutting the section's vertical
  // height roughly in half without dropping any tiles.
  return (
    <section className="max-w-[1480px] mx-auto px-4 md:px-6 py-16">
      <div
        className="relative rounded-3xl border border-white/10 overflow-hidden p-6 md:p-10"
        style={{
          background:
            "linear-gradient(140deg, #0f1016 0%, #15132a 60%, #111118 100%)",
        }}
      >
        {/* Soft purple glow behind the left intro panel — matches the hero
            radial pattern used elsewhere on the page so the showcase feels
            like part of the same visual system. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 20% 40%, rgba(99,102,241,0.20) 0%, rgba(167,139,250,0.05) 45%, transparent 75%)",
          }}
        />

        {/* Grid: intro on the left (fixed-ish min-width), masonry on the
            right takes the rest. The right column is significantly wider
            than the intro at lg+ (~3:1 ratio) so the masonry has room to
            spread into 4 columns instead of being squeezed into 3. */}
        <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_1fr] gap-8 lg:gap-10">
          {/* ===== LEFT — intro panel ===== */}
          <div className="flex flex-col">
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-[#a78bfa]/30 bg-[#6366f1]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c4b5fd] mb-5">
              <Sparkles className="h-3 w-3" />
              {badge}
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.05] mb-4">
              {title}
            </h2>

            <p className="text-base md:text-lg text-zinc-300 leading-relaxed mb-7 max-w-md">
              {subtitle}
            </p>

            <Link
              href={ctaHref}
              className="group relative inline-flex self-start items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b7bff] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ boxShadow: "0 8px 24px rgba(99,102,241,0.40)" }}
            >
              <Sparkles className="h-4 w-4" />
              {ctaText}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* ===== RIGHT — masonry grid =====
              CSS columns gives natural masonry behavior — variable-height
              tiles slot in without us computing heights manually. Each
              tile uses break-inside-avoid so it never splits across cols. */}
          {/* CSS columns count breakpoints:
                - mobile (default): 2 columns
                - md (≥768px):     3 columns
                - xl (≥1280px):    4 columns
              At 4 cols × ~2.25 tiles per col, total height drops by ~⅓
              vs the 3-col layout. Mobile and tablet stay 2/3 cols so
              tiles don't get postage-stamp small. */}
          <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
            {tiles.map((tile, i) => (
              <ShowcaseTileCard key={tile.src + i} tile={tile} />
            ))}
          </div>
        </div>

        {/* ===== Bottom row — secondary "view all" link ===== */}
        {viewAllText && viewAllHref && (
          <div className="relative mt-8 flex justify-end">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              {viewAllText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ShowcaseTileCard({ tile }: { tile: ShowcaseTile }) {
  // Convert "16/9" → "16 / 9" for CSS aspectRatio property.
  const aspectCss = tile.aspectRatio.replace("/", " / ");

  return (
    <div
      className="relative break-inside-avoid overflow-hidden rounded-xl border border-white/[0.08] bg-[#111118] transition-all hover:border-[#6366f1]/50"
      style={{ aspectRatio: aspectCss }}
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
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      )}
    </div>
  );
}
