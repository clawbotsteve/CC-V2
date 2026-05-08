"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { ToolType } from "@prisma/client";
import { useUserContext } from "@/components/layout/user-context";
import { CreditCost } from "@/components/credit-cost";

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  characterName: string;
  onConfirm: () => void;
}

/**
 * Likeness consent modal — required before kicking off LoRA training.
 * Mirrors the three-checkbox pattern from the legacy Influencer flow
 * so the audit trail is consistent. Server-side
 * /api/character-studio/[id]/finalize rejects any submission without
 * `consentAccepted=true`, so this is the only path to start training.
 */
export function ConsentModal({ open, onOpenChange, characterName, onConfirm }: Props) {
  const { creditCosts, availableCredit } = useUserContext();
  const [own, setOwn] = useState(false);
  const [original, setOriginal] = useState(false);
  const [terms, setTerms] = useState(false);

  const allChecked = own && original && terms;

  // Pull the live AVATAR_TRAINING cost for this user's plan from the
  // creditCosts map (resolved server-side from ToolCreditCost). Falls
  // back to the default ~67-72 range if the map is empty during a
  // brief context refetch.
  const trainingCost = (() => {
    const v = creditCosts?.[ToolType.AVATAR_TRAINING];
    if (typeof v === "number") return v;
    if (v && typeof v === "object") {
      const n = (v as Record<string, number>).default ?? Object.values(v as Record<string, number>)[0];
      return typeof n === "number" ? n : undefined;
    }
    return undefined;
  })();
  const insufficient =
    trainingCost !== undefined &&
    availableCredit !== undefined &&
    availableCredit < trainingCost;

  const reset = () => {
    setOwn(false);
    setOriginal(false);
    setTerms(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm to start training</DialogTitle>
          <DialogDescription>
            {characterName} is about to be trained as a LoRA. Confirm the
            three statements below — all are required.
          </DialogDescription>
        </DialogHeader>

        {/* Cost preview — what this training will deduct from the user's
            credit balance. Visible BEFORE they tick the consent boxes
            so there are no surprises. Pulls the live AVATAR_TRAINING
            cost for the user's plan from user-context (server is the
            source of truth; this is just a preview). */}
        <div className="rounded-xl border border-[#a78bfa]/30 bg-[#6366f1]/10 p-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium text-[#c4b5fd] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Training cost
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              One-time charge. Re-rolls don't re-train — your LoRA stays usable forever.
            </p>
          </div>
          <div className="text-right">
            <CreditCost
              toolType={ToolType.AVATAR_TRAINING}
              creditCosts={creditCosts}
              variant="default"
            />
            {availableCredit !== undefined && (
              <p
                className={`text-[11px] mt-1 ${
                  insufficient ? "text-red-300" : "text-muted-foreground"
                }`}
              >
                Balance: {Math.floor(availableCredit)}
              </p>
            )}
          </div>
        </div>

        {insufficient && (
          <p className="text-xs text-red-300 -mt-1">
            Not enough credits. Top up before you can start training.
          </p>
        )}

        <div className="space-y-3 py-2">
          <ConsentRow
            checked={own}
            onChange={setOwn}
            label="The references are of myself, or of a person whose written consent I have on file."
          />
          <ConsentRow
            checked={original}
            onChange={setOriginal}
            label="I am not training a likeness of a celebrity, public figure, or any person who has not consented."
          />
          <ConsentRow
            checked={terms}
            onChange={setTerms}
            label="I accept the TraviaLabs Terms of Service and the Acceptable Use Policy for this character."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!allChecked || insufficient}
            onClick={onConfirm}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
          >
            {insufficient
              ? "Insufficient credits"
              : trainingCost !== undefined
                ? `Start training · ${trainingCost} credits`
                : "Start training"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConsentRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        checked ? "border-[#6366f1] bg-[#6366f1]/10" : "border-border bg-card/40"
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
          checked ? "border-[#6366f1] bg-[#6366f1]" : "border-zinc-500"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <p className="text-sm">{label}</p>
    </button>
  );
}
