"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

/**
 * Empty-state onboarding card for tool pages. Displays a 3-step visual
 * walkthrough plus an optional sample asset on the final step. Designed
 * to render in place of the generation history when the user has zero
 * generations yet — disappears as soon as they've made one.
 *
 * Reusable across tool pages (image gen, upscale, face enhance, etc.) by
 * passing different step configs. Currently mounted only on
 * /tools/video-generation; roll out to other tools as a follow-up.
 */
export interface ToolStep {
  /** Step number badge (1, 2, 3...). */
  number: number;
  title: string;
  description: string;
  /** Optional icon for steps without media (typically steps 1-2). */
  icon?: LucideIcon;
  /** Optional sample video URL for the final "Get X" step. Mutually
   *  exclusive with imageSrc. */
  videoSrc?: string;
  /** Optional sample image URL. Falls back to gradient if both this and
   *  videoSrc are missing. */
  imageSrc?: string;
}

interface ToolHowItWorksProps {
  /** Big bold title shown above the cards. */
  title: string;
  /** One-line description under the title. */
  subtitle: string;
  /** Exactly 3 steps recommended for a clean horizontal layout. The
   *  component will gracefully accept 2-4 but the visual rhythm is best
   *  at 3. */
  steps: ToolStep[];
}

export function ToolHowItWorks({ title, subtitle, steps }: ToolHowItWorksProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f1016]/60 p-6 md:p-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => (
          <StepCard key={step.number} step={step} />
        ))}
      </div>
    </section>
  );
}

function StepCard({ step }: { step: ToolStep }) {
  const { number, title, description, icon: Icon, videoSrc, imageSrc } = step;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#111118] transition-all hover:border-[#6366f1]/50">
      {/* Media area (top of card) — fills with sample video, image, or
          a gradient + icon depending on what was passed. */}
      <div
        className="relative w-full bg-gradient-to-br from-[#1a1a2e] to-[#111118] overflow-hidden"
        style={{ aspectRatio: "16 / 10" }}
      >
        {videoSrc ? (
          <video
            src={videoSrc}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            controlsList="nodownload noplaybackrate noremoteplayback"
          />
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : Icon ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-12 w-12 text-[#8b7bff]/50" strokeWidth={1.5} />
          </div>
        ) : null}

        {/* Step number badge — floats over the media in the upper-left
            corner so it's always visible regardless of asset content. */}
        <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#6366f1] text-xs font-bold text-white shadow-lg">
          {number}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
