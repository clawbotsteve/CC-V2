"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Fires ONCE, the moment a user fresh from the onboarding questionnaire
 * sees their first generated image render. Two jobs:
 *
 *   1. Celebrate the activation moment (they got a wow → don't waste it)
 *   2. Surface the natural next-step: Character Studio (Creator $49/mo)
 *      so the upgrade trigger lives at the exact emotional peak when
 *      the user is thinking "this is amazing, how do I get MORE of THIS
 *      specific person?" — which is what Character Studio answers.
 *
 * Also offers 3 quick follow-up prompts for users who close the
 * upgrade path — gives them next-content to keep generating while
 * reinforcing image-only's LIMITATION (every gen produces a *different*
 * person → reinforces the Character Studio value prop organically).
 *
 * Trigger: caller (the image-gen page) opens this when
 *   localStorage.getItem("tavira_onboarding_active") === "1"
 *   AND a generation completes successfully.
 * On dismiss / upgrade click / try-prompt click, the flag is cleared
 * so this is strictly one-shot per signup.
 */

type FollowUpPrompt = {
  label: string;
  hint: string;
  prompt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  imageUrl?: string;
  /** Original prompt the user generated with — used to seed the
   *  three follow-up variations so they read as natural extensions
   *  of "the same character, different scene." */
  basePrompt?: string;
};

/**
 * Build three follow-up prompts that vary scene/outfit/mood while
 * keeping the same character description. These are intentionally
 * generic — the user just generated their character with a polished
 * GPT Image 2 prompt; we append a scene modifier rather than rewrite.
 */
function buildFollowUps(basePrompt: string): FollowUpPrompt[] {
  const base = (basePrompt || "the same AI character from the previous image").trim();
  return [
    {
      label: "Different outfit",
      hint: "Try a streetwear look",
      prompt: `${base}, now wearing oversized streetwear (graphic tee + cargo pants + sneakers), full-body shot, urban setting, golden hour lighting, 9:16.`,
    },
    {
      label: "Different setting",
      hint: "Take them to the beach",
      prompt: `${base}, now at a tropical beach at sunset, walking along the shoreline, warm golden hour light, 9:16.`,
    },
    {
      label: "Different mood",
      hint: "Make it editorial / glam",
      prompt: `${base}, editorial high-fashion glam portrait, dramatic studio lighting, bold makeup, magazine cover styling, 9:16.`,
    },
  ];
}

export default function PostOnboardingCelebrationModal({
  open,
  onClose,
  imageUrl,
  basePrompt,
}: Props) {
  const router = useRouter();
  const followUps = buildFollowUps(basePrompt || "");

  function clearFlag() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("tavira_onboarding_active");
      } catch {
        /* incognito — already won't re-fire */
      }
    }
  }

  function handleClose() {
    clearFlag();
    onClose();
  }

  function handleUpgrade() {
    clearFlag();
    router.push("/pricing?from=post-onboarding");
  }

  function handleTryPrompt(prompt: string) {
    clearFlag();
    // Drop them back into image-gen with the new prompt pre-filled.
    // Same pattern the questionnaire uses.
    const url = new URL("/tools/image-generation", window.location.origin);
    url.searchParams.set("model", "gpt-image-2");
    url.searchParams.set("prompt", prompt);
    router.push(url.pathname + url.search);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl border-white/10 bg-[#0f1016] p-0 overflow-hidden">
        {/* Header with celebration + dismiss */}
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <DialogTitle className="text-xl font-semibold text-white">
              Meet your AI character
            </DialogTitle>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-zinc-200 -mr-2 -mt-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 px-6 pb-6">
          {/* Generated image preview */}
          {imageUrl ? (
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-black">
              <Image
                src={imageUrl}
                alt="Your AI character"
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10" />
          )}

          {/* Right column: upgrade pitch + value prop */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Love them? <span className="text-white font-semibold">Lock this exact
                character in</span> with Character Studio — train a LoRA so every
                future image, video, or ad has the <span className="text-white">same
                face, same vibe, every time.</span>
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Right now every generation produces a different person. Character
                Studio fixes that.
              </p>
            </div>

            <Button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] hover:brightness-110 text-white h-11 text-sm font-semibold w-full justify-center"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Build the full character — Creator $49/mo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="text-[11px] text-zinc-500 -mt-2">
              Includes unlimited LoRAs · 600 credits/mo · Soul 2.0 · priority queue
            </div>
          </div>
        </div>

        {/* "Or keep generating" — three follow-up prompts */}
        <div className="border-t border-white/10 px-6 py-5 bg-black/20">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-3">
            Or keep generating with this prompt
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {followUps.map((f) => (
              <button
                key={f.label}
                onClick={() => handleTryPrompt(f.prompt)}
                className="text-left rounded-lg border border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 px-3 py-2.5 transition"
              >
                <div className="text-sm font-medium text-white">{f.label}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{f.hint}</div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-3">
            Heads up: each generation will look like a <em>different</em> person
            unless you train a Character Studio LoRA. That&apos;s the upgrade above.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
