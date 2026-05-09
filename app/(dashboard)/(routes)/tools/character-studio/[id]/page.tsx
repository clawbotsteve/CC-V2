"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Upload, Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Influencer, ToolType } from "@prisma/client";
import { uploadFiles } from "@/lib/utils";
import { useUserContext } from "@/components/layout/user-context";
import { CreditCost } from "@/components/credit-cost";
import { ConsentModal } from "./_components/ConsentModal";
import { ProgressBar } from "./_components/ProgressBar";
import { VARIATION_PROMPTS } from "@/lib/character-studio/variation-prompts";
import { NICHES, Niche } from "@/lib/character-studio/prompt-scaffolds";

type CharacterStudioInfluencer = Influencer & {
  lora?: { status: string; loraUrl?: string | null } | null;
};

type JobImage = { id: string; status: string; imageUrl: string; prompt: string };

type StepKey = "reference" | "variations" | "training" | "prompts" | "complete";

const STEP_ORDER: StepKey[] = ["reference", "variations", "training", "prompts", "complete"];

/**
 * Character Studio wizard. Resumes from whatever step the character
 * is currently at (server-side `characterStudioStep` is the source of
 * truth). Each step has a clear "kick off the next thing" CTA at the
 * bottom; we never auto-advance — the user always confirms.
 *
 * Polling: when there are jobs in flight (variations or prompt pack),
 * we poll the GET endpoint every 4s until everything resolves. We
 * stop polling once all known job IDs report status="completed".
 */
export default function CharacterStudioWizardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [character, setCharacter] = useState<CharacterStudioInfluencer | null>(null);
  const [jobImages, setJobImages] = useState<Record<string, JobImage>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCharacter = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/character-studio/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Character not found.");
          router.push("/tools/character-studio");
          return;
        }
        throw new Error(await res.text());
      }
      const data = await res.json();
      setCharacter(data.character);
      const map: Record<string, JobImage> = {};
      for (const img of data.jobImages || []) map[img.id] = img;
      setJobImages(map);
    } catch (err) {
      console.error("[CHARACTER-STUDIO_WIZARD] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // Initial fetch + poll for in-flight jobs.
  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  useEffect(() => {
    // Poll while we have any queued/processing jobs OR while training is in progress.
    const hasInflightJobs = Object.values(jobImages).some(
      (j) => j.status === "queued" || j.status === "processing"
    );
    const isTraining =
      character?.characterStudioStep === "training" &&
      (character?.lora?.status !== "completed" || !character?.lora?.loraUrl);

    if (!hasInflightJobs && !isTraining) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }

    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(fetchCharacter, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [jobImages, character, fetchCharacter]);

  // Auto-recover stuck trainings: while a row is in step="training"
  // and the webhook hasn't updated the LoRA yet, manually poll Tavira
  // AI's queue every 30 seconds. The /training-status endpoint
  // mirrors the webhook's update path (saves loraUrl, marks completed,
  // charges credits) so the wizard self-heals even if our webhook
  // delivery is lost. Polling lazily — only when we're actually
  // waiting on training, never burns network when not needed.
  const trainingPollRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const isTraining =
      character?.characterStudioStep === "training" &&
      (character?.lora?.status !== "completed" || !character?.lora?.loraUrl);

    if (!isTraining || !id) {
      if (trainingPollRef.current) clearInterval(trainingPollRef.current);
      trainingPollRef.current = null;
      return;
    }

    if (trainingPollRef.current) return;
    const tick = async () => {
      try {
        const res = await fetch(`/api/character-studio/${id}/training-status`, {
          method: "POST",
        });
        if (res.ok) {
          // Server-side already patched the row if Tavira AI says
          // completed — refetch to surface the new state.
          fetchCharacter();
        }
      } catch {
        // Silent — the next 30s tick will retry.
      }
    };
    // Fire once immediately so users who land on a long-stuck row see
    // the resolution within seconds rather than waiting 30s.
    void tick();
    trainingPollRef.current = setInterval(tick, 30_000);
    return () => {
      if (trainingPollRef.current) clearInterval(trainingPollRef.current);
      trainingPollRef.current = null;
    };
  }, [character?.characterStudioStep, character?.lora?.status, character?.lora?.loraUrl, id, fetchCharacter]);

  if (loading || !character) {
    return (
      <PageContainer>
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  const currentStep = (character.characterStudioStep as StepKey) || "reference";

  return (
    <PageContainer scrollable>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
        <button
          onClick={() => router.push("/tools/character-studio")}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to library
        </button>

        <div className="mt-4 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{character.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {character.niche
                ? `${NICHES[character.niche as Niche]?.emoji} ${NICHES[character.niche as Niche]?.label}`
                : "Character"}
              {character.characterStudioCharType ? ` · ${character.characterStudioCharType}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar
            currentStep={STEP_ORDER.indexOf(currentStep === "reference" && !character.characterStudioRef ? "reference" : currentStep)}
            steps={STEP_ORDER}
          />
        </div>

        {/* ===== STEP CONTENT ===== */}
        <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6">
          {currentStep === "reference" || (currentStep === "setup" as any) ? (
            <StepReference
              character={character}
              working={working}
              setWorking={setWorking}
              onDone={fetchCharacter}
            />
          ) : currentStep === "variations" ? (
            <StepVariations
              character={character}
              jobImages={jobImages}
              working={working}
              setWorking={setWorking}
              onStartTraining={() => setConsentOpen(true)}
              onRefresh={fetchCharacter}
            />
          ) : currentStep === "training" || currentStep === "prompts" || currentStep === "complete" ? (
            <StepTrainingAndPack
              character={character}
              jobImages={jobImages}
              working={working}
              setWorking={setWorking}
              onRefresh={fetchCharacter}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Unknown step.</p>
          )}
        </div>
      </div>

      <ConsentModal
        open={consentOpen}
        onOpenChange={setConsentOpen}
        characterName={character.name}
        onConfirm={async () => {
          setConsentOpen(false);
          await startTraining(character, setWorking, fetchCharacter);
        }}
      />
    </PageContainer>
  );
}

/* ─────────────────────────────────────── STEP 2 ─────────────────────────────────────── */

function StepReference({
  character,
  working,
  setWorking,
  onDone,
}: {
  character: CharacterStudioInfluencer;
  working: boolean;
  setWorking: (b: boolean) => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"generate" | "upload">("generate");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const generate = async () => {
    setWorking(true);
    try {
      const res = await fetch(`/api/character-studio/${character.id}/reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Generation failed.");
        return;
      }
      toast.success("Base reference generated. Review it on the next step.");
      onDone();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setWorking(false);
    }
  };

  const submitUpload = async () => {
    if (!uploadedUrl) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/character-studio/${character.id}/reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "upload", uploadUrl: uploadedUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't save upload.");
        return;
      }
      toast.success("Reference saved. Continue to variations.");
      onDone();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setWorking(false);
    }
  };

  // Already has a reference — show it + a "Looks good, continue" CTA.
  if (character.characterStudioRef) {
    return (
      <div>
        <h2 className="text-xl font-semibold">Step 2 · Base reference</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This is the anchor for all six variations. Re-generate if you want a different look.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
            <Image
              src={character.characterStudioRef}
              alt="Base reference"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col gap-3 self-end">
            <Button onClick={generate} disabled={working} variant="outline">
              {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Re-generate
            </Button>
            <Button
              onClick={async () => {
                // Move forward by kicking off variations directly.
                setWorking(true);
                try {
                  const res = await fetch(`/api/character-studio/${character.id}/variations`, {
                    method: "POST",
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    toast.error(data?.error || "Couldn't start variations.");
                    return;
                  }
                  toast.success("Generating 6 variations…");
                  onDone();
                } catch (err) {
                  console.error(err);
                  toast.error("Something went wrong.");
                } finally {
                  setWorking(false);
                }
              }}
              disabled={working}
              className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
            >
              Continue to variations <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Step 2 · Pick a base reference</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Generate a base reference from your description, or upload your own photo.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("generate")}
          className={`rounded-xl border px-4 py-3 text-left transition-colors ${
            mode === "generate"
              ? "border-[#6366f1] bg-[#6366f1]/15 text-[#c4b5fd]"
              : "border-border bg-card/40 hover:border-[#6366f1]/40"
          }`}
        >
          <Wand2 className="h-5 w-5 mb-1" />
          <div className="font-medium text-sm">Generate (GPT Image 2)</div>
          <div className="text-xs text-muted-foreground">
            One AI portrait from your description. ~10 seconds.
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-xl border px-4 py-3 text-left transition-colors ${
            mode === "upload"
              ? "border-[#6366f1] bg-[#6366f1]/15 text-[#c4b5fd]"
              : "border-border bg-card/40 hover:border-[#6366f1]/40"
          }`}
        >
          <Upload className="h-5 w-5 mb-1" />
          <div className="font-medium text-sm">Upload your own</div>
          <div className="text-xs text-muted-foreground">
            Use a real photo. Must be of yourself or have written consent.
          </div>
        </button>
      </div>

      <div className="mt-6">
        {mode === "generate" ? (
          <Button
            onClick={generate}
            disabled={working}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
          >
            {working ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating reference…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Generate base reference
              </>
            )}
          </Button>
        ) : (
          <UploadReference
            uploadedUrl={uploadedUrl}
            setUploadedUrl={setUploadedUrl}
            onSubmit={submitUpload}
            working={working}
          />
        )}
      </div>
    </div>
  );
}

function UploadReference({
  uploadedUrl,
  setUploadedUrl,
  onSubmit,
  working,
}: {
  uploadedUrl: string | null;
  setUploadedUrl: (s: string | null) => void;
  onSubmit: () => void;
  working: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFiles({
        files: [file],
        maxFiles: 1,
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      // The upload route returns either { urls: string[] } or { url: string }
      const url = (result as any)?.urls?.[0] || (result as any)?.url;
      if (!url) {
        toast.error("Upload failed.");
        return;
      }
      setUploadedUrl(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePick}
      />
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || working}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" /> Choose image
            </>
          )}
        </Button>
        {uploadedUrl && (
          <Button
            onClick={onSubmit}
            disabled={working}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
          >
            {working ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Use this as reference
          </Button>
        )}
      </div>
      {uploadedUrl && (
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black max-w-xs">
          <Image src={uploadedUrl} alt="Uploaded reference" fill className="object-cover" sizes="320px" />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── STEP 3 ─────────────────────────────────────── */

function StepVariations({
  character,
  jobImages,
  working,
  setWorking,
  onStartTraining,
  onRefresh,
}: {
  character: CharacterStudioInfluencer;
  jobImages: Record<string, JobImage>;
  working: boolean;
  setWorking: (b: boolean) => void;
  onStartTraining: () => void;
  onRefresh: () => void;
}) {
  const { creditCosts } = useUserContext();
  const variationIds = character.characterStudioVariations || [];
  // A tile is "usable" when its GeneratedImage row is completed AND
  // has a non-empty imageUrl. Some FAL jobs come back with status
  // completed but no URL (filtered output, edge-case failure) — those
  // must NOT count toward the LoRA training set.
  const usable = variationIds.filter((id) => {
    const img = jobImages[id];
    return img?.status === "completed" && !!img?.imageUrl;
  });
  const failed = variationIds.filter((id) => {
    const img = jobImages[id];
    return img?.status === "failed" || (img?.status === "completed" && !img?.imageUrl);
  });
  const allSettled = usable.length + failed.length === variationIds.length && variationIds.length > 0;
  // LoRA training needs ≥4 references to converge. Server-side ZIP
  // build also enforces this floor — keep the client gate matched so
  // users aren't stuck if one tile fails.
  const canContinue = usable.length >= 4 && allSettled;

  const reroll = async () => {
    setWorking(true);
    try {
      const res = await fetch(`/api/character-studio/${character.id}/variations`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't generate variations.");
        return;
      }
      toast.success("Variations queued.");
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setWorking(false);
    }
  };

  const retryOne = async (idx: number) => {
    setWorking(true);
    try {
      const res = await fetch(`/api/character-studio/${character.id}/variations/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: idx }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Retry failed.");
        return;
      }
      toast.success("Retrying that tile…");
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Step 3 · Six variations</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Same person, six different angles + one wildcard. These become the LoRA training set.
      </p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Always show the base reference as tile #0 so the user can compare. */}
        {character.characterStudioRef && (
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
            <Image
              src={character.characterStudioRef}
              alt="Base reference"
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-xs">
              Base
            </div>
          </div>
        )}

        {VARIATION_PROMPTS.map((v, idx) => {
          const jobId = variationIds[idx];
          const img = jobId ? jobImages[jobId] : undefined;
          const url = img?.imageUrl;
          // "completed but no URL" is a soft failure (model produced
          // nothing usable). Distinguish it from "still processing"
          // so the user gets a retry button instead of an indefinite
          // spinner.
          const isFailed =
            img?.status === "failed" || (img?.status === "completed" && !img?.imageUrl);
          return (
            <div
              key={v.number}
              className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-border"
            >
              {url ? (
                <Image
                  src={url}
                  alt={v.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : isFailed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <span className="text-xs text-red-300 font-medium">Couldn't generate</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-2">{v.label}</span>
                  <button
                    type="button"
                    onClick={() => retryOne(idx)}
                    disabled={working}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#6366f1]/50 bg-[#6366f1]/10 px-3 py-1 text-[11px] font-medium text-[#c4b5fd] hover:bg-[#6366f1]/20 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry this tile
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground p-3 text-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{v.label}</span>
                </div>
              )}
              {v.isWildcard && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#6366f1]/80 text-xs font-bold">
                  Wild
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={reroll} disabled={working} variant="outline">
          {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Re-roll variations
        </Button>
        <Button
          onClick={onStartTraining}
          disabled={!canContinue || working}
          className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
        >
          {canContinue
            ? `Continue to training (${usable.length}/6 ready)`
            : allSettled
              ? `Need at least 4 — retry tiles below (${usable.length}/6)`
              : `Waiting (${usable.length}/${variationIds.length})…`}
          {canContinue && (
            <>
              <CreditCost
                toolType={ToolType.AVATAR_TRAINING}
                creditCosts={creditCosts}
                variant="default"
              />
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── STEPS 4 + 5 ─────────────────────────────────────── */

function StepTrainingAndPack({
  character,
  jobImages,
  working,
  setWorking,
  onRefresh,
}: {
  character: CharacterStudioInfluencer;
  jobImages: Record<string, JobImage>;
  working: boolean;
  setWorking: (b: boolean) => void;
  onRefresh: () => void;
}) {
  const { creditCosts } = useUserContext();
  const trainingDone = character.lora?.status === "completed" && !!character.lora?.loraUrl;
  const trainingFailed = character.status === "failed";
  const promptPack = (character.characterStudioPromptPack as Array<any>) || [];

  // Tick the elapsed clock so the user can see SOMETHING moving while
  // they wait. FAL doesn't expose mid-training progress percentages
  // for flux-lora training, so a live "Started X min ago" is the most
  // honest signal we can give. Re-renders every 10s; that's enough
  // for "X min Y sec" feel without hammering React.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (trainingDone || trainingFailed) return;
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, [trainingDone, trainingFailed]);

  // Training row was created when /finalize swapped the draft, so
  // updatedAt is a reasonable proxy for "training started." If it
  // pre-dates the swap (legacy rows) we just hide the elapsed time.
  const trainingStartedAt = character.updatedAt ? new Date(character.updatedAt).getTime() : null;
  const elapsedMs = trainingStartedAt ? Math.max(0, now - trainingStartedAt) : null;
  const elapsedLabel = elapsedMs != null ? formatElapsed(elapsedMs) : null;
  // FAL flux-lora at 2000 steps usually finishes in 5–10 min; we
  // bump the upper bound to 15 min for slack. If we're past 15 min,
  // start nudging the user that something's probably wrong.
  const stale = elapsedMs != null && elapsedMs > 15 * 60_000;

  const launchPromptPack = async () => {
    setWorking(true);
    try {
      const res = await fetch(`/api/character-studio/${character.id}/prompt-pack`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't queue prompt pack.");
        return;
      }
      toast.success("15 prompts queued — they'll appear as they finish.");
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setWorking(false);
    }
  };

  /**
   * Manually re-poll Tavira AI for the LoRA training status. Used when
   * the webhook didn't fire (or was dropped) and the row has been
   * stuck in "queued" longer than the user's patience. Server-side
   * patches the row to completed/failed if Tavira AI knows the result;
   * we just refetch the character to surface the new state.
   */
  const checkStatusNow = async () => {
    setWorking(true);
    try {
      const res = await fetch(
        `/api/character-studio/${character.id}/training-status`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Status check failed.");
        return;
      }
      if (data.outcome === "completed") {
        toast.success("Training was actually done — recovered the LoRA.");
      } else if (data.outcome === "failed") {
        toast.error("Tavira AI reports this training failed. Re-roll variations and try again.");
      } else {
        toast.info("Still in progress. Hang tight or check back in a few minutes.");
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">
        Step 4 · LoRA training {promptPack.length > 0 ? "+ prompt pack" : ""}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Training takes 5–15 minutes. While you wait, queue the 15-image prompt pack —
        they'll generate from your description in parallel and be ready before training finishes.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-black/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">LoRA training</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trainingDone
                ? "Trained. Use this character anywhere in TraviaLabs."
                : trainingFailed
                  ? "Training failed. Re-roll variations and try again, or contact support if this keeps happening."
                  : stale
                    ? "Training is taking longer than usual. Tavira AI may be backed up — refresh in a couple minutes, and we'll reach out if it doesn't complete."
                    : "Tavira AI is training your LoRA. This usually takes 5–10 minutes (max 15). The page will auto-update — feel free to leave and come back."}
            </p>
            {!trainingDone && !trainingFailed && elapsedLabel && (
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Started {elapsedLabel} ago · est. {stale ? "any moment" : "5–10 min total"}</span>
              </p>
            )}
          </div>
          <div
            className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${
              trainingDone
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : trainingFailed
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-[#6366f1]/40 bg-[#6366f1]/10 text-[#c4b5fd]"
            }`}
          >
            {trainingDone ? "✓ Trained" : trainingFailed ? "Failed" : stale ? "Stalled?" : "Training"}
          </div>
        </div>

        {/* Indeterminate progress bar — visual reassurance only.
            FAL's training endpoint doesn't surface step-by-step
            progress for flux-lora, so we can't show a real %.
            The shimmer is enough to communicate "still alive." */}
        {!trainingDone && !trainingFailed && (
          <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
              style={{ animation: "cs-shimmer 1.6s ease-in-out infinite" }}
            />
          </div>
        )}

        {/* Recovery actions when training appears stalled. The
            webhook is supposed to update the row when training
            completes — if it didn't (FAL hiccup, dropped delivery,
            etc.) the row sits in "queued" forever. "Check status
            now" pulls the result directly from Tavira AI; if the
            training actually completed, the LoRA is recovered and
            we patch the row. */}
        {!trainingDone && !trainingFailed && stale && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={checkStatusNow}
              disabled={working}
              variant="outline"
              size="sm"
            >
              {working ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
              )}
              Check status now
            </Button>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes cs-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>

      {/* Honest disclaimer: prompt-pack images are zero-shot from the
          description, NOT the trained LoRA. Once training finishes,
          users can re-run any prompt with the LoRA loaded for
          actual likeness consistency. Surfacing this avoids the
          "why don't the faces match?" confusion. */}
      {promptPack.length > 0 && !trainingDone && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-100/80">
            <span className="font-semibold text-amber-200">Heads up: </span>
            Prompt-pack images below are previews from your description — they
            won't all look like the same person yet. Once training finishes,
            re-run any of these prompts with the trained LoRA for full likeness consistency.
          </p>
        </div>
      )}

      {/* Prompt pack section */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Prompt pack</h3>
          {promptPack.length === 0 && (
            <Button
              onClick={launchPromptPack}
              disabled={working}
              size="sm"
              className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate 15 prompts
              {/* Per-image cost shown next to the CTA. Total = 15× this. */}
              <CreditCost
                toolType={ToolType.IMAGE_GENERATOR}
                creditCosts={creditCosts}
                variant="gpt_image_2_medium"
              />
            </Button>
          )}
        </div>

        {promptPack.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            15 niche-specific images you can post immediately. Saved to your image library.
            <span className="ml-1 text-[#c4b5fd]">15 × per-image cost shown on the button.</span>
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {promptPack.map((p) => {
              const img = p.jobId ? jobImages[p.jobId] : undefined;
              const url = img?.imageUrl;
              const isPortrait = (p.aspectRatio || "9:16") === "9:16";
              return (
                <div
                  key={p.scaffoldNumber}
                  className={`relative ${isPortrait ? "aspect-[9/16]" : "aspect-video"} rounded-lg overflow-hidden bg-black border border-border`}
                  title={p.label}
                >
                  {url ? (
                    <Image
                      src={url}
                      alt={p.label}
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <p className="text-[10px] truncate">{p.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {trainingDone && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
          <p className="text-sm">
            <span className="font-semibold text-emerald-300">Ready.</span>{" "}
            Use this character in the Image Generator (LoRA dropdown) or Avatar-to-Video.
          </p>
          <Button
            onClick={() => (window.location.href = `/tools/image-generation?model=flux-lora&lora_id=${character.id}`)}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
          >
            Generate <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── helpers ─────────────────────────────────────── */

/**
 * Kick off LoRA training. The server-side /finalize endpoint now
 * builds the training ZIP itself (fetches the FAL CDN images
 * server-side, where there's no browser-CORS dance), so the client
 * just confirms consent and POSTs.
 */
async function startTraining(
  character: CharacterStudioInfluencer,
  setWorking: (b: boolean) => void,
  onDone: () => void,
) {
  setWorking(true);
  try {
    const res = await fetch(`/api/character-studio/${character.id}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentAccepted: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error || "Couldn't start training.");
      return;
    }

    toast.success("Training started! ETA 5–15 min.");

    // The finalize endpoint swapped the row to a new id (the FAL
    // training requestId). Route the user to that new URL.
    if (data.newCharacterId && data.newCharacterId !== character.id) {
      window.location.href = `/tools/character-studio/${data.newCharacterId}`;
      return;
    }
    onDone();
  } catch (err: any) {
    console.error(err);
    toast.error(err?.message || "Something went wrong starting training.");
  } finally {
    setWorking(false);
  }
}

/** "Started 3 min ago" / "Started 12 sec ago". Capped at 99 min so we
 *  don't render a wall of text on stuck rows. */
function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec} sec`;
  const min = Math.floor(totalSec / 60);
  if (min < 60) {
    const sec = totalSec % 60;
    return sec === 0 ? `${min} min` : `${min} min ${sec} sec`;
  }
  return `${Math.min(min, 99)}+ min`;
}
