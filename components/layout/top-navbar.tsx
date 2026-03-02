"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  Menu,
  X,
  LogOut,
  UserCircle,
  CreditCard,
  Sparkles,
  Video,
  WandSparkles,
  Image,
  Pencil,
  MessageSquare,
  Brush,
  ChevronDown,
} from "lucide-react";
import { useUserContext } from "./user-context";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatarProfile } from "@/components/user-avatar-profile";
import { PlanLabel } from "@/components/plan-label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navLinks = [
  { label: "Explore", href: "/dashboard", active: true },
  {
    label: "Image",
    href: "/tools/image-generation",
    panel: {
      features: [
        { name: "Generate Image", desc: "Text to image in one click" },
        { name: "Style Transfer", desc: "Apply visual identity fast" },
        { name: "Upscale", desc: "Enhance quality for export" },
      ],
      models: [
        { name: "Nano Banana 2", desc: "High-detail image generation", href: "/tools/image-generation?model=nano-banana-2", badge: "TOP" },
        { name: "Nano Banana 2 Edit", desc: "Multi-image edit + high fidelity", href: "/tools/image-generation?model=nano-banana-2-edit", badge: "NEW" },
        { name: "Flux LoRA", desc: "Character-consistent outputs", href: "/tools/image-generation?model=flux-lora", badge: "POPULAR" },
        { name: "Flux Pro V1", desc: "Reliable general generation", href: "/tools/image-generation?model=flux-v1" },
      ],
    },
  },
  {
    label: "Video",
    href: "/tools/video-generation",
    panel: {
      features: [
        { name: "Create Video", desc: "Generate short cinematic clips" },
        { name: "Motion Control", desc: "Guide camera movement" },
        { name: "Lipsync Studio", desc: "Talking-head video workflows" },
      ],
      models: [
        { name: "Kling 2.6", desc: "Cinematic video generation", href: "/tools/video-generation?model=kling-2.6", badge: "POPULAR" },
        { name: "Kling Motion Control", desc: "Reference-driven motion", href: "/tools/video-generation?model=kling-motion-control", badge: "NEW" },
        { name: "Bytedance", desc: "Creative NSFW-friendly generation", href: "/tools/video-generation?model=bytedance" },
        { name: "Veo 3.1", desc: "Premium high-fidelity video", href: "/tools/video-generation?model=veo-3.1", badge: "NEW" },
      ],
    },
  },
  {
    label: "Edit",
    href: "/tools/image-upscale?model=seedvr-image",
    panel: {
      features: [
        { name: "Image Editor", desc: "Replace, remove, retouch", href: "/tools/image-upscale?model=seedvr-image" },
        { name: "Face Enhance", desc: "Improve skin and detail" },
        { name: "Upscale", desc: "4x quality enhancement" },
      ],
      models: [
        { name: "SeedVR Image Upscale", desc: "High-quality image upscaler", href: "/tools/image-upscale?model=seedvr-image", badge: "NEW" },
        { name: "Bytedance Video Upscale", desc: "Video upscaler (1080p/2K/4K)", href: "/tools/image-upscale?model=bytedance-video", badge: "POPULAR" },
      ],
    },
  },
  {
    label: "Character",
    href: "/tools/influencers",
    panel: {
      features: [
        { name: "Influencer Builder", desc: "Create custom AI personas" },
        { name: "Soul ID", desc: "Consistent identity setup" },
        { name: "UGC Factory", desc: "Scale creator-style content" },
      ],
      models: [
        { name: "LoRA Training", desc: "Train your custom character", href: "/tools/influencers?model=lora-training" },
        { name: "Avatar to Video", desc: "Turn avatars into clips", href: "/tools/influencers?model=avatar-to-video" },
      ],
    },
  },
  { label: "Apps", href: "/tools" },
];

const mobileNavItems = [
  { label: "Explore", icon: Sparkles, href: "/dashboard" },
  { label: "Image", icon: Image, href: "/tools/image-generation" },
  { label: "Video", icon: Video, href: "/tools/video-generation" },
  { label: "Enhance", icon: Brush, href: "/tools/face-enhance" },
  { label: "Face Swap", icon: WandSparkles, href: "/tools/face-swap" },
  { label: "Upscale", icon: Image, href: "/tools/image-upscale" },
  { label: "Edit", icon: Pencil, href: "/tools/image-upscale?model=seedvr-image" },
  { label: "Prompt", icon: MessageSquare, href: "/tools/prompt-generation" },
  { label: "Pricing", icon: CreditCard, href: "/pricing" },
];

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="nav-lg" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1"/>
        <stop offset="100%" stopColor="#c084fc"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" stroke="url(#nav-lg)" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <circle cx="24" cy="24" r="12" stroke="url(#nav-lg)" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <circle cx="24" cy="24" r="5" fill="url(#nav-lg)"/>
    <line x1="24" y1="4" x2="24" y2="12" stroke="url(#nav-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <line x1="24" y1="36" x2="24" y2="44" stroke="url(#nav-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <line x1="4" y1="24" x2="12" y2="24" stroke="url(#nav-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <line x1="36" y1="24" x2="44" y2="24" stroke="url(#nav-lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

export default function TopNavbar() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const { availableCredit, meta } = useUserContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const creditPercent = Math.max(0, Math.min(100, Number(availableCredit ?? 0)));

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', height: '56px' }}>
      <div className="h-14 max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        {/* LEFT - Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcon />
            <span className="font-display font-bold text-xl tracking-tight text-foreground">Tavira Labs</span>
          </Link>

          {/* Center nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all inline-flex items-center gap-1 ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    {item.panel && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
                  </Link>

                  {item.panel && (
                    <div className="pointer-events-none absolute left-0 top-full pt-3 opacity-0 translate-y-1 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0">
                      <div className="w-[620px] rounded-2xl border border-white/10 bg-[#171a22] p-4 shadow-2xl">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="mb-3 text-xs uppercase tracking-wider text-zinc-400">Features</p>
                            <div className="space-y-2">
                              {item.panel.features.map((feature) => (
                                <div key={feature.name} className="rounded-xl border border-white/5 bg-white/5 p-3">
                                  <div className="text-sm font-semibold text-white">{feature.name}</div>
                                  <div className="text-xs text-zinc-400">{feature.desc}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="mb-3 text-xs uppercase tracking-wider text-zinc-400">Models</p>
                            <div className="space-y-2">
                              {item.panel.models.map((model) => (
                                <Link
                                  key={model.name}
                                  href={model.href || item.href}
                                  className="block rounded-xl border border-white/5 bg-white/5 p-3 transition hover:border-[#6366f1]/60 hover:bg-white/10"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/10 text-[11px]">✦</span>
                                    <div className="text-sm font-semibold text-white">{model.name}</div>
                                    {model.badge && (
                                      <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${model.badge === "NEW" ? "bg-lime-300 text-black" : model.badge === "TOP" ? "bg-fuchsia-500/25 text-fuchsia-200 border border-fuchsia-300/40" : "bg-indigo-400/20 text-indigo-200 border border-indigo-300/40"}`}>
                                        {model.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-400">{model.desc}</div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-sm font-semibold text-lime-300 hover:bg-lime-300/15"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-200"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/pricing"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-white/10"
              >
                Pricing
              </Link>
              <Link
                href="/assets"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-white/10"
              >
                Assets
              </Link>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none">
                    <UserAvatarProfile user={user ?? null} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-2xl border-white/10 bg-[#171a22] p-2">
                  <div className="px-2 pt-1 pb-2">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Link href="/pricing" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 inline-flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Pricing
                      </Link>
                      <Link href="/assets" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 inline-flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Assets
                      </Link>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-2">
                      <div className="text-sm text-zinc-200 mb-2">{creditPercent}% credits left</div>
                      <div className="h-2 w-full rounded-full bg-zinc-700/70 overflow-hidden mb-3">
                        <div className="h-full rounded-full bg-lime-300" style={{ width: `${creditPercent}%` }} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-sm font-medium text-zinc-200">Go Premium</span>
                        <Link href="/pricing" className="rounded-lg bg-lime-300 px-2.5 py-1 text-xs font-bold text-black hover:bg-lime-200">Upgrade</Link>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 mb-2">
                      <div className="text-sm font-semibold text-zinc-100 truncate">{user?.firstName || user?.fullName || "User"}</div>
                      <div className="text-xs text-zinc-400 truncate"><PlanLabel /></div>
                    </div>
                  </div>

                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link href="/settings" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      View profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link href="/settings" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Manage account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link href="https://discord.com/invite/clawd" target="_blank" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Join our community
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-white/10" />
                  <SignOutButton>
                    <DropdownMenuItem className="rounded-lg flex items-center gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </SignOutButton>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile hamburger */}
          {isSignedIn && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-2 mt-8">
                  {mobileNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSheetOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                          isActive
                            ? "text-primary font-medium bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  );
}
