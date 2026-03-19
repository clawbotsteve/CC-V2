"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.2,
      },
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 pb-12 pt-16 md:pt-24">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(99,102,241,0.22)_0%,rgba(139,92,246,0.10)_35%,transparent_72%)]"
      />

      <div className="mx-auto max-w-7xl px-6 text-center">
        <AnimatedGroup variants={transitionVariants}>
          <Link
            href="/tools"
            className="group mx-auto inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            <span>Introducing Support for AI Models</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-white/20">
              <ArrowRight className="size-3" />
            </span>
          </Link>

          <h1 className="mx-auto mt-8 max-w-5xl text-balance font-display text-5xl font-black tracking-tight text-white md:text-6xl xl:text-7xl">
            Turn one idea into a week of high-converting content
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-zinc-300 md:text-lg">
            TraviaLabs helps creators and brands generate images, videos, and AI influencers in one fast workflow.
          </p>
        </AnimatedGroup>

        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.3,
                },
              },
            },
            ...transitionVariants,
          }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="rounded-xl px-6">
            <Link href="/tools/image-generation">Start Creating</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-xl px-6 text-zinc-200 hover:text-white">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </AnimatedGroup>
      </div>
    </section>
  );
}
