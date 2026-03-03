"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0b14] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <Sparkles className="h-3.5 w-3.5" />
          TraviaLabs Discovery
        </div>

        <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
          Create AI images, videos, upscale, and characters in one place.
        </h1>

        <p className="mt-5 max-w-2xl text-zinc-300 text-base md:text-lg">
          Start from Discovery first. When you click to create or log in, Clerk opens and signs you in.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#7c5cff] px-5 py-3 font-semibold hover:opacity-90">
                Create your first image
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignInButton>

            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 font-semibold text-zinc-200 hover:bg-white/5">
                Login
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-[#7c5cff] px-5 py-3 font-semibold hover:opacity-90"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
