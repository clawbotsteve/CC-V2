"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type AuthWallModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signUpHref?: string;
  signInHref?: string;
};

export function AuthWallModal({
  open,
  onOpenChange,
  signUpHref = "/sign-up",
  signInHref = "/sign-in",
}: AuthWallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#111118]">
        <DialogTitle className="text-center text-2xl font-bold text-white">
          Create an account to see generated images
        </DialogTitle>
        <DialogDescription className="text-center text-zinc-400">
          Sign up and generate for free.
        </DialogDescription>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-6 text-center">
          <p className="text-sm text-zinc-300">Your preview is ready. Unlock full results instantly.</p>
          <Link
            href={signUpHref}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-black hover:bg-lime-200"
          >
            Sign up for free
          </Link>
          <p className="mt-3 text-xs text-zinc-400">
            Already have an account?{" "}
            <Link href={signInHref} className="font-semibold text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
