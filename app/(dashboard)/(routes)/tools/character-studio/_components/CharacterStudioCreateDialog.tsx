"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NICHES, NICHE_KEYS, Niche } from "@/lib/character-studio/prompt-scaffolds";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Called with the new character's id once Step 1 succeeds. */
  onCreated: (id: string) => void;
}

const CHAR_TYPES: Array<{ key: "female" | "male" | "animated"; label: string; emoji: string }> = [
  { key: "female", label: "Female", emoji: "👩" },
  { key: "male", label: "Male", emoji: "👨" },
  { key: "animated", label: "Animated", emoji: "🎨" },
];

/**
 * Step 1 of the Character Studio wizard. Collects:
 *   - niche (required)
 *   - character type (female / male / animated, visual-only)
 *   - name (required)
 *   - description (≥20 chars; this becomes the {character} block in
 *     every prompt scaffold, so encouraging detail here pays off
 *     across all 15 prompts in the pack)
 *   - brand / product (optional; populates {brand} / {product})
 *
 * On submit, POSTs to /api/character-studio. The server creates an
 * Influencer row in "draft" mode (characterStudioStep="setup"),
 * returns its id, and the dialog routes the user to /[id] for the
 * remaining steps.
 */
export function CharacterStudioCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [niche, setNiche] = useState<Niche | "">("");
  const [charType, setCharType] = useState<"female" | "male" | "animated">("female");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setNiche("");
    setCharType("female");
    setName("");
    setDescription("");
    setBrand("");
    setProduct("");
  };

  const canSubmit =
    niche !== "" &&
    name.trim().length > 0 &&
    description.trim().length >= 20 &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/character-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          niche,
          charType,
          description,
          brand: brand.trim() || undefined,
          product: product.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Couldn't create character.");
        return;
      }
      toast.success("Character created — let's pick a base reference.");
      reset();
      onOpenChange(false);
      onCreated(data.character.id);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#a78bfa]" />
            Build a Character
          </DialogTitle>
          <DialogDescription>
            Step 1 of 5 — tell us who they are. We'll handle the references, training, and prompt pack from here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label className="mb-2 block">Niche</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NICHE_KEYS.map((key) => {
                const cfg = NICHES[key];
                const selected = niche === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNiche(key)}
                    className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                      selected
                        ? "border-[#6366f1] bg-[#6366f1]/15 text-[#c4b5fd]"
                        : "border-border bg-card/40 hover:border-[#6366f1]/40"
                    }`}
                  >
                    <div className="text-2xl mb-1">{cfg.emoji}</div>
                    <div className="font-medium text-sm">{cfg.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {cfg.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Character type</Label>
            <div className="grid grid-cols-3 gap-2">
              {CHAR_TYPES.map((t) => {
                const selected = charType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setCharType(t.key)}
                    className={`rounded-xl border px-3 py-3 transition-colors ${
                      selected
                        ? "border-[#6366f1] bg-[#6366f1]/15 text-[#c4b5fd]"
                        : "border-border bg-card/40 hover:border-[#6366f1]/40"
                    }`}
                  >
                    <div className="text-xl mb-1">{t.emoji}</div>
                    <div className="text-sm font-medium">{t.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Visual style only — used to pick the right reference style. Not surfaced to viewers.
            </p>
          </div>

          <div>
            <Label htmlFor="cs-name" className="mb-2 block">
              Name
            </Label>
            <Input
              id="cs-name"
              placeholder="e.g. Maya, Jordan, Aria"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="cs-desc" className="mb-2 block">
              Description
            </Label>
            <Textarea
              id="cs-desc"
              placeholder="A 27-year-old fitness creator with shoulder-length brown hair, athletic build, warm brown eyes, confident but approachable energy."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length < 20
                ? `${20 - description.length} more characters needed.`
                : "Looks good — this becomes the base of every prompt."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cs-brand" className="mb-2 block">
                Brand <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="cs-brand"
                placeholder="e.g. Iron Lab Co."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cs-product" className="mb-2 block">
                Featured product <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="cs-product"
                placeholder="e.g. PR-1 Pre-Workout"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…
              </>
            ) : (
              <>Continue to Step 2</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
