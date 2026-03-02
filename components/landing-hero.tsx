"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export const LandingHero = () => {
  const { isSignedIn } = useAuth();

  const getSignUpPath = () => {
    const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up";
    try {
      const url = new URL(signUpUrl);
      return url.pathname;
    } catch {
      return signUpUrl.startsWith("/") ? signUpUrl : `/${signUpUrl}`;
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-10 pt-20 text-center md:pt-24">
      <div className="mb-6 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1 text-sm text-indigo-200">
        • Now in public beta
      </div>

      <h1 className="text-balance text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
        This is where you build your <span className="text-indigo-400">AI Influencer</span>
      </h1>

      <p className="mt-6 max-w-3xl text-balance text-base text-zinc-300 md:text-2xl">
        Build AI influencers that post, grow, and generate income — without you lifting a finger.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href={isSignedIn ? "/dashboard" : getSignUpPath()}>
          <Button variant="premium" className="rounded-xl px-8 py-6 text-base font-semibold">
            Get Started Free
          </Button>
        </Link>

        <Link href="#examples">
          <Button variant="outline" className="rounded-xl border-white/20 bg-transparent px-8 py-6 text-base text-white hover:bg-white/10">
            See Examples ↓
          </Button>
        </Link>
      </div>
    </section>
  );
};
