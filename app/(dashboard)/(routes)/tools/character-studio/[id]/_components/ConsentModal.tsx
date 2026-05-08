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
import { Check } from "lucide-react";

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
  const [own, setOwn] = useState(false);
  const [original, setOriginal] = useState(false);
  const [terms, setTerms] = useState(false);

  const allChecked = own && original && terms;

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
            disabled={!allChecked}
            onClick={onConfirm}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b7bff] text-white"
          >
            Start training
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
