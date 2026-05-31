"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * 4-step personalization onboarding. Asks the new user a handful of
 * questions, synthesizes a polished GPT Image 2 prompt server-side, then
 * drops them into the image-gen tool with the prompt pre-filled and their
 * single trial credit ready to fire.
 */

type Goal = "influencer" | "character" | "self" | "explore";
type Gender = "female" | "male" | "androgynous";
type AgeRange = "21-25" | "26-30" | "31-55" | "56+";
type SkinTone = "light" | "medium" | "olive" | "tan" | "dark";
type HairLength = "short" | "medium" | "long";
type HairColor = "brown" | "blonde" | "black" | "red" | "auburn" | "white";
type EyeColor = "brown" | "blue" | "green" | "hazel" | "gray";
type Style =
  | "casual"
  | "glam"
  | "editorial"
  | "streetwear"
  | "athletic"
  | "attractive"
  | "supermodel";

export type OnboardingAnswers = {
  goal: Goal;
  gender?: Gender;
  ageRange?: AgeRange;
  skinTone?: SkinTone;
  hairLength?: HairLength;
  hairColor?: HairColor;
  eyeColor?: EyeColor;
  style?: Style;
};

const GOAL_OPTIONS: Array<{ value: Goal; emoji: string; label: string; desc: string }> = [
  { value: "influencer", emoji: "🌟", label: "AI Influencer", desc: "Build a model for content & social" },
  { value: "character", emoji: "🎮", label: "Character", desc: "Game, story, or world-building" },
  { value: "self", emoji: "👤", label: "Self-portrait", desc: "An avatar that looks like you" },
  { value: "explore", emoji: "💭", label: "Just exploring", desc: "Skip and go to the dashboard" },
];

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "androgynous", label: "Androgynous" },
];

const AGE_OPTIONS: Array<{ value: AgeRange; label: string }> = [
  { value: "21-25", label: "21–25" },
  { value: "26-30", label: "26–30" },
  { value: "31-55", label: "31–55" },
  { value: "56+", label: "56+" },
];

const SKIN_OPTIONS: Array<{ value: SkinTone; label: string }> = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "olive", label: "Olive" },
  { value: "tan", label: "Tan" },
  { value: "dark", label: "Dark" },
];

const HAIR_LENGTH_OPTIONS: Array<{ value: HairLength; label: string }> = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const HAIR_COLOR_OPTIONS: Array<{ value: HairColor; label: string }> = [
  { value: "brown", label: "Brown" },
  { value: "blonde", label: "Blonde" },
  { value: "black", label: "Black" },
  { value: "red", label: "Red" },
  { value: "auburn", label: "Auburn" },
  { value: "white", label: "Silver / White" },
];

const EYE_OPTIONS: Array<{ value: EyeColor; label: string }> = [
  { value: "brown", label: "Brown" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "hazel", label: "Hazel" },
  { value: "gray", label: "Gray" },
];

const STYLE_OPTIONS: Array<{ value: Style; label: string }> = [
  { value: "casual", label: "Casual" },
  { value: "glam", label: "Glam" },
  { value: "editorial", label: "Editorial" },
  { value: "streetwear", label: "Streetwear" },
  { value: "athletic", label: "Athletic" },
  { value: "attractive", label: "Attractive" },
  { value: "supermodel", label: "Supermodel" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function OnboardingQuestionnaire({ open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>({ goal: "influencer" });
  const [synthesizedPrompt, setSynthesizedPrompt] = useState("");
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);

  const totalSteps = 4;

  function setAnswer<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSkipOrComplete() {
    // Mark onboarding done so we don't re-show the modal next time.
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // best-effort; if it fails the cookie still hides the modal locally
    }
    onClose();
  }

  async function handleAdvance() {
    // "Just exploring" short-circuits the whole flow.
    if (step === 1 && answers.goal === "explore") {
      await handleSkipOrComplete();
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Moving from step 3 → 4: synthesize the prompt.
    setSynthLoading(true);
    setSynthError(null);
    try {
      const res = await fetch("/api/onboarding/synthesize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSynthesizedPrompt(data.prompt || "");
      setStep(4);
    } catch (err: any) {
      setSynthError(err?.message || "Failed to build your prompt. Try again?");
    } finally {
      setSynthLoading(false);
    }
  }

  async function handleGenerate() {
    // Mark onboarding done, then redirect to the image-gen tool with the
    // prompt pre-filled. The image-gen page reads ?prompt= and ?model= from
    // the URL and pre-fills the form.
    //
    // Also set a localStorage flag so the image-gen page knows this user
    // is fresh from onboarding — on their FIRST successful generation it
    // fires the PostOnboardingCelebrationModal (the "build the full
    // character with Character Studio" upgrade hook). Flag is cleared
    // once the celebration is shown OR dismissed, so it's strictly
    // one-shot per session.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("tavira_onboarding_active", "1");
      } catch {
        /* localStorage unavailable (incognito, etc.) — celebration just
           won't fire; no functional break */
      }
    }
    await handleSkipOrComplete();
    const url = new URL("/tools/image-generation", window.location.origin);
    url.searchParams.set("model", "gpt-image-2");
    url.searchParams.set("prompt", synthesizedPrompt);
    router.push(url.pathname + url.search);
  }

  const goalOk = !!answers.goal;
  const step2Ok = !!answers.gender && !!answers.ageRange && !!answers.skinTone;
  const step3Ok =
    !!answers.hairLength && !!answers.hairColor && !!answers.eyeColor && !!answers.style;

  const canAdvance =
    (step === 1 && goalOk) ||
    (step === 2 && step2Ok) ||
    (step === 3 && step3Ok) ||
    step === 4;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSkipOrComplete()}>
      <DialogContent className="max-w-xl border-white/10 bg-[#0f1016] p-0">
        {/* progress dots */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-8 rounded-full transition ${
                  i < step ? "bg-emerald-400" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkipOrComplete}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Skip
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-5">
          {step === 1 && (
            <>
              <DialogTitle className="text-xl font-semibold text-white">
                Let&apos;s build your AI character
              </DialogTitle>
              <p className="text-sm text-zinc-400">
                A few quick questions and we&apos;ll generate your first one — free.
              </p>
              <div className="grid gap-2">
                {GOAL_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setAnswer("goal", o.value)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      answers.goal === o.value
                        ? "border-emerald-400/60 bg-emerald-400/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl">{o.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{o.label}</div>
                      <div className="text-xs text-zinc-400">{o.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <DialogTitle className="text-xl font-semibold text-white">
                Tell us about your model
              </DialogTitle>

              <Field label="Gender">
                <ChipRow
                  options={GENDER_OPTIONS}
                  value={answers.gender}
                  onChange={(v) => setAnswer("gender", v)}
                />
              </Field>

              <Field label="Age">
                <ChipRow
                  options={AGE_OPTIONS}
                  value={answers.ageRange}
                  onChange={(v) => setAnswer("ageRange", v)}
                />
              </Field>

              <Field label="Skin tone">
                <ChipRow
                  options={SKIN_OPTIONS}
                  value={answers.skinTone}
                  onChange={(v) => setAnswer("skinTone", v)}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <DialogTitle className="text-xl font-semibold text-white">
                Pick the look
              </DialogTitle>

              <Field label="Hair length">
                <ChipRow
                  options={HAIR_LENGTH_OPTIONS}
                  value={answers.hairLength}
                  onChange={(v) => setAnswer("hairLength", v)}
                />
              </Field>

              <Field label="Hair color">
                <ChipRow
                  options={HAIR_COLOR_OPTIONS}
                  value={answers.hairColor}
                  onChange={(v) => setAnswer("hairColor", v)}
                />
              </Field>

              <Field label="Eyes">
                <ChipRow
                  options={EYE_OPTIONS}
                  value={answers.eyeColor}
                  onChange={(v) => setAnswer("eyeColor", v)}
                />
              </Field>

              <Field label="Style / vibe">
                <ChipRow
                  options={STYLE_OPTIONS}
                  value={answers.style}
                  onChange={(v) => setAnswer("style", v)}
                />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <DialogTitle className="text-xl font-semibold text-white">
                Your AI character is ready
              </DialogTitle>
              <p className="text-sm text-zinc-400">
                Tweak the prompt if you&apos;d like, then hit generate — uses your
                free trial credit. ~30 seconds.
              </p>
              <Textarea
                value={synthesizedPrompt}
                onChange={(e) => setSynthesizedPrompt(e.target.value)}
                rows={6}
                className="font-mono text-xs leading-relaxed bg-black/30"
              />
            </>
          )}

          {synthError && (
            <p className="text-xs text-red-400">{synthError}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          {step > 1 && step < 4 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="text-zinc-400 hover:text-white"
            >
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < 4 ? (
            <Button
              onClick={handleAdvance}
              disabled={!canAdvance || synthLoading}
              className="bg-emerald-400 text-black hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/30"
            >
              {synthLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building your prompt…
                </>
              ) : step === 3 ? (
                "Build my prompt"
              ) : (
                "Next"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!synthesizedPrompt.trim()}
              className="bg-emerald-400 text-black hover:bg-emerald-300"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate my character
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-zinc-200">{label}</div>
      {children}
    </div>
  );
}

function ChipRow<V extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: V; label: string }>;
  value?: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            value === o.value
              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 text-zinc-300 hover:border-white/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
