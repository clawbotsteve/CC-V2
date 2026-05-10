"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Plus, Loader2, MoreVertical, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/page-container";
import AiAnimatedHeading from "@/components/ai-animated-heading";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

  // Delete-confirmation state. Keyed by character (not boolean) so we
  // know WHICH character the user is confirming deletion for.
  const [pendingDelete, setPendingDelete] = useState<CharacterStudioInfluencer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/character-studio/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't delete this character.");
        return;
      }
      toast.success(`${pendingDelete.name} has been deleted.`);
      // Optimistically drop from local state so the card disappears
      // immediately; the next library refetch will confirm.
      setCharacters((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      console.error("[CHARACTER-STUDIO] delete failed", err);
      toast.error("Something went wrong. Try again?");
    } finally {
      setDeleting(false);
    }
  };

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
                onOpen={() => router.push(`/tools/character-studio/${c.id}`)}
                onDelete={() => setPendingDelete(c)}
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

      {/* Delete-confirmation modal. Lives at the page level (not inside
          CharacterCard) so the AlertDialog portal isn't re-mounted per
          card and so the confirm action has access to the page-level
          fetch state. The disclaimer is intentionally direct — once
          deleted the user really does lose access to the LoRA, prompt
          pack, and variations from their library, even though the row
          is soft-deleted server-side for audit retention. */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(next) => !next && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete {pendingDelete?.name ?? "this character"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You'll <span className="font-semibold text-red-300">permanently lose access</span> to:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-sm">
                <li>The trained LoRA (you won't be able to use it in the Image Generator)</li>
                <li>The 6 variation images and base reference</li>
                <li>The 15-image prompt pack</li>
                <li>This character's slot in your library</li>
              </ul>
              <span className="block pt-2 text-amber-300/90 text-sm">
                This can't be undone. Your credits won't be refunded.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete forever
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function CharacterCard({
  character,
  onOpen,
  onDelete,
}: {
  character: CharacterStudioInfluencer;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const niche = (character.niche as Niche | null) ?? null;
  const nicheConfig = niche ? NICHES[niche] : null;
  const status = computeStatus(character);

  // Card is now a div (not a button) so we can nest the dropdown
  // trigger as its own interactive element. The whole card opens the
  // wizard on click; the 3-dot menu opens the actions menu and
  // stops propagation so it doesn't ALSO route to the wizard.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group relative text-left rounded-2xl border border-border bg-card/60 overflow-hidden hover:border-[#6366f1]/50 transition-colors cursor-pointer"
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

        {/* Status pill — top-right (existing). */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-xs font-medium">
          {status.label}
        </div>

        {/* 3-dot actions menu — top-left, on hover for desktop and
            always-visible on mobile (no hover state). Clicking the
            trigger MUST stop propagation so it doesn't fire the
            card's onOpen. */}
        <div
          className="absolute top-2 left-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Character actions"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur hover:bg-black/80 text-white border border-white/10"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              // Clicks inside the menu shouldn't bubble up to the card.
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete character
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    </div>
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
