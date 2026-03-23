"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type OutOfFreeCreditsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OutOfFreeCreditsModal({ open, onOpenChange }: OutOfFreeCreditsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#111118]">
        <DialogTitle className="text-center text-2xl font-bold text-white">Out of Free credits</DialogTitle>
        <DialogDescription className="text-center text-zinc-400">
          You used all 3 free credits. Upgrade to keep generating with Tavira tools.
        </DialogDescription>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-6 text-center">
          <p className="text-sm text-zinc-300">Unlock monthly plans for more image and video generations.</p>

          <Link
            href="/pricing"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-black hover:bg-lime-200"
          >
            Keep generating
          </Link>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-3 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
