"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Explore", href: "/dashboard" },
  { label: "Image", href: "/tools/image-generation" },
  { label: "Video", href: "/tools/video-generation" },
  { label: "Edit", href: "/tools/image-editor" },
  { label: "Character", href: "/tools/influencers" },
  { label: "Apps", href: "/dashboard" },
];

export const LandingNavbar = () => {
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

  const getSignInPath = () => {
    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
    try {
      const url = new URL(signInUrl);
      return url.pathname;
    } catch {
      return signInUrl.startsWith("/") ? signInUrl : `/${signInUrl}`;
    }
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#06070f]/80 px-4 py-4 backdrop-blur-xl md:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white md:text-xl">
          Tavira Labs
        </Link>

        <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isSignedIn && (
            <Link href={getSignInPath()}>
              <Button variant="ghost" className="text-zinc-200 hover:text-white">
                Sign In
              </Button>
            </Link>
          )}
          <Link href={isSignedIn ? "/dashboard" : getSignUpPath()}>
            <Button variant="premium" className="rounded-xl px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
