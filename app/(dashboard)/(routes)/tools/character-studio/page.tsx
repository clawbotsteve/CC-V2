"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import PageContainer from "@/components/page-container";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/components/layout/user-context";
import { resolveAccessTier, canUseCharacterStudio } from "@/lib/plan-access";
import { NICHES, Niche } from "@/lib/character-studio/prompt-scaffolds";
import { Influencer, GenerationStatus } from "@prisma/client";
import { CharacterStudioCreateDialog } from "./_components/CharacterStudioCreateDialog";

type CharacterStudioInfluencer = Influencer & {
  lora?: { status: GenerationStatus | string; loraUrl?: string | null } | null;
};

/**
 * Character Studio library + entry. Lists every Influencer the user
 * built via the wizard, with status badges (drafting / training /
 * ready). The "Build a Character" button opens the Step-1 dialog,
 * which on submit routes to /tools/character-studio/[id] for the
 * remaining steps.
 *
 * Plan gate: Creator+ only. Lower-tier users see an upsell card
 * instead of the library.
 */
export default function CharacterStudioPage() {
  const router = useRouter();
  const { plan, isLoading: isContextLoading } = useUserContext();
  const access = resolveAccessTier(plan);
  const canAccess = canUseCharacterStudio(access);

  const [characters, setCharacters] = useState<CharacterStudioInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchCharacters = async () => {
    try {
      const res = await fetch("/api/character-studio");
      const data = await res.json();
      if (Array.isArray(data?.characters)) {
        setCharacters(data.characters);
      }
    } catch (err) {
      console.error("[CHARACTER-STUDIO] fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchCharacters();
    } else {
      setLoading(false);
    }
  }, [canAccess]);

  return (
    <PageContainer scrollable>
      <div className="w-full p-4 md:p-8">
        <div className="py-4 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between border-b border-foreground/40">
          <AiAnimatedHeading
            heading="Character Studio"
            description="Build a fully-trained AI character end-to-end — niche, reference, variations, LoRA, prompt pack."
            icon={<Sparkles className="h-6 w-6" />}
          />

          {canAccess && (
            <div className="flex items-end">
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" /> Build a Character
              </Button>
            </div>
          )}
        </div>

        {!canAccess && !isContextLoading ? (
          <UpsellCard />
        ) : loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : characters.length === 0 ? (
          <EmptyState onStart={() => setCreateOpen(true)} />
        ) : (
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {characters.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                onClick={() => router.push(`/tools/character-studio/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CharacterStudioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => router.push(`/tools/character-studio/${id}`)}
      />
    </PageContainer>
  );
}

function CharacterCard({
  character,
  onClick,
}: {
  character: CharacterStudioInfluencer;
  onClick: () => void;
}) {
  const niche = (character.niche as Niche | null) ?? null;
  const nicheConfig = niche ? NICHES[niche] : null;
  const status = computeStatus(character);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl border border-border bg-card/60 overflow-hidden hover:border-[#6366f1]/50 transition-colors"
    >
      <div className="relative aspect-[3/4] bg-black">
        {character.characterStudioRef ? (
          <Image
            src={character.characterStudioRef}
            alt={character.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No reference yet
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-xs font-medium">
          {status.label}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold truncate">{character.name}</p>
          {nicheConfig && <span className="text-base">{nicheConfig.emoji}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {nicheConfig?.label ?? "Character"}
          {character.characterStudioCharType ? ` · ${character.characterStudioCharType}` : ""}
        </p>
      </div>
    </button>
  );
}

function computeStatus(c: CharacterStudioInfluencer): { label: string; tone: string } {
  const step = c.characterStudioStep;
  // "Ready" can be signaled by the Influencer's own loraUrl/status
  // (what the webhook + recovery endpoint write to) OR the optional
  // Lora marketplace relation. Earlier versions only checked the Lora
  // relation, so recovered Character Studio rows showed as "Training"
  // forever in the library.
  const trainedNow =
    (c.status === "completed" && !!c.loraUrl) ||
    (c.lora?.status === "completed" && !!c.lora?.loraUrl);
  if (step === "complete" || trainedNow) {
    return { label: "Ready", tone: "text-emerald-400" };
  }
  if (step === "training" || c.status === "queued" || c.status === "processing") {
    return { label: "Training", tone: "text-yellow-300" };
  }
  if (c.status === "failed") {
    return { label: "Failed", tone: "text-red-400" };
  }
  return { label: "Drafting", tone: "text-zinc-300" };
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="pt-12 max-w-xl mx-auto text-center">
      <div className="rounded-2xl border border-dashed border-border p-10">
        <Sparkles className="h-10 w-10 mx-auto text-[#a78bfa]" />
        <h2 className="mt-4 text-xl font-semibold">Build your first AI character</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Pick a niche, write a quick description, and Tavira handles the rest:
          base reference → 6 consistent variations → LoRA training → 15 ready-to-post images.
        </p>
        <Button
          onClick={onStart}
          className="mt-6 bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Build a Character
        </Button>
      </div>
    </div>
  );
}

function UpsellCard() {
  return (
    <div className="pt-12 max-w-xl mx-auto text-center">
      <div className="rounded-2xl border border-[#a78bfa]/30 bg-[#6366f1]/10 p-10">
        <Sparkles className="h-10 w-10 mx-auto text-[#a78bfa]" />
        <h2 className="mt-4 text-xl font-semibold">Character Studio is on Creator +</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          The full character build burns ~30 generations per character. We
          gate it to Creator so you have the credits to actually use it.
        </p>
        <Link
          href="/settings/billing"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b7bff] px-5 py-3 text-sm font-bold text-white"
        >
          Upgrade to Creator
        </Link>
      </div>
    </div>
  );
}
