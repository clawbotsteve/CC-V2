"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
};

const slides = [
  {
    id: "welcome_value",
    title: "Welcome to Tavira Labs",
    subtitle: "Create high-performing content in minutes — from one workflow.",
    bullets: [
      "Generate image variations fast",
      "Turn ideas into short-form videos",
      "Upscale and enhance for ad-ready quality",
      "Build consistent AI influencers for campaigns",
    ],
  },
  {
    id: "best_results",
    title: "How to get the best results",
    subtitle: "Small prompt changes make a big difference.",
    do: [
      "Be specific (subject + setting + lighting + style)",
      "Generate multiple variations, then refine",
      "Upload clean references for consistency",
    ],
    dont: [
      "Use vague prompts like ‘make it good’",
      "Mix multiple subjects in one request",
      "Use blurry or low-quality reference images",
    ],
  },
  {
    id: "credits_clarity",
    title: "How credits work",
    subtitle: "Use free credits to test, then scale when you’re ready.",
    body: [
      "Your free plan includes starter credits to begin generating immediately.",
      "Different tools use different credit amounts (video and advanced edits use more).",
      "Use free credits to find winning styles, then upgrade when you need volume.",
    ],
    helperText: "You can monitor usage anytime in your dashboard.",
  },
  {
    id: "launch_offer",
    title: "Lock in launch pricing today",
    subtitle: "Start now and scale without paying full price later.",
    bodyText:
      "Get access to higher limits, faster generation, advanced tools, and creator workflows built for serious output.",
    offerCallout: "Launch pricing is live now — once it ends, standard pricing applies.",
    trustLine: "Cancel anytime. No long-term commitment.",
  },
] as const;

export function GenerateOnboardingModal({ open, onOpenChange, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = slides[step];
  const isLast = step === slides.length - 1;

  const progress = useMemo(() => ((step + 1) / slides.length) * 100, [step]);

  const closeAndContinueFree = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_v2_seen", "1");
    }
    onOpenChange(false);
  };

  const complete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_v2_seen", "1");
    }
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-white/10 bg-[#07070c] text-white">
        <DialogHeader>
          <DialogTitle className="text-sm text-zinc-400">Step {step + 1} of {slides.length}</DialogTitle>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <h2 className="text-3xl font-bold tracking-tight">{current.title}</h2>
          <p className="text-zinc-300">{current.subtitle}</p>

          {"bullets" in current && (
            <ul className="space-y-2 text-zinc-200">
              {current.bullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          )}

          {"do" in current && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="mb-2 text-sm font-semibold text-emerald-300">Do</p>
                <ul className="space-y-1 text-sm text-zinc-200">
                  {current.do.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <p className="mb-2 text-sm font-semibold text-rose-300">Don’t</p>
                <ul className="space-y-1 text-sm text-zinc-200">
                  {current.dont.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {"body" in current && (
            <div className="space-y-2 text-zinc-200">
              {current.body.map((line) => (
                <p key={line}>• {line}</p>
              ))}
              <p className="pt-2 text-sm text-zinc-400">{current.helperText}</p>
            </div>
          )}

          {"offerCallout" in current && (
            <div className="space-y-3">
              <p className="text-zinc-200">{current.bodyText}</p>
              <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-sm font-semibold text-violet-200">
                {current.offerCallout}
              </p>
              <p className="text-sm text-zinc-400">{current.trustLine}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/15 bg-transparent text-zinc-200" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </Button>
            <Button variant="ghost" className="text-zinc-300" onClick={closeAndContinueFree}>
              Continue on Free
            </Button>
          </div>

          {isLast ? (
            <Button className="bg-violet-600 hover:bg-violet-500" onClick={complete}>Claim Launch Price</Button>
          ) : (
            <Button className="bg-violet-600 hover:bg-violet-500" onClick={() => setStep((s) => Math.min(slides.length - 1, s + 1))}>Next</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
