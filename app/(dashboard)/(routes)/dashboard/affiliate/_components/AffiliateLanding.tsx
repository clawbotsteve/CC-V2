"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Link2, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface AffiliateLandingProps {
  onJoined: () => void;
}

const benefits = [
  {
    icon: DollarSign,
    title: "Earn Commission",
    description: "Get a percentage of every sale from users you refer. The more you share, the more you earn.",
  },
  {
    icon: Link2,
    title: "Unique Affiliate Link",
    description: "Get your own tracking link. Share it anywhere — social media, email, your website.",
  },
  {
    icon: Users,
    title: "90-Day Cookie",
    description: "When someone clicks your link, you get credit for their purchase for up to 90 days.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Dashboard",
    description: "Track clicks, conversions, and earnings in real time from your affiliate dashboard.",
  },
];

const steps = [
  { step: "1", title: "Join the program", description: "Click the button below to get started instantly" },
  { step: "2", title: "Share your link", description: "Post your unique link on social media, YouTube, or your website" },
  { step: "3", title: "Earn money", description: "Get paid when your referrals subscribe to any paid plan" },
];

export function AffiliateLanding({ onJoined }: AffiliateLandingProps) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      // This endpoint auto-generates an affiliate code for the user
      const res = await fetch("/api/affiliate/string");
      if (!res.ok) throw new Error("Failed to join program");
      const data = await res.json();

      if (data.affiliateString) {
        toast.success("Welcome to the affiliate program!");
        onJoined();
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="w-full space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-1.5 text-sm font-medium text-lime-300">
          <DollarSign className="h-4 w-4" />
          Affiliate Program
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          Earn money by sharing
          <br />
          <span className="bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-transparent">
            TraviaLabs
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Join our affiliate program and earn commission on every paid subscription from users you refer.
        </p>
        <Button
          onClick={handleJoin}
          disabled={joining}
          size="lg"
          className="bg-lime-300 text-black hover:bg-lime-200 font-semibold text-base px-8 py-6 rounded-xl mt-2"
        >
          {joining ? "Setting up..." : "Join Program"}
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center space-y-3"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lime-300/10 text-lime-300 font-bold text-lg">
                {s.step}
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">Why join?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5 text-lime-300" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* What you get */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-4">
        <h2 className="text-xl font-semibold">What you get</h2>
        <div className="space-y-3">
          {[
            "Commission on every paid subscription from your referrals",
            "Your own unique shareable affiliate link",
            "Real-time earnings and referral tracking dashboard",
            "90-day cookie window — no rush for conversions",
            "Request payouts directly from your dashboard",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-lime-300 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-8">
        <Button
          onClick={handleJoin}
          disabled={joining}
          size="lg"
          className="bg-lime-300 text-black hover:bg-lime-200 font-semibold text-base px-8 py-6 rounded-xl"
        >
          {joining ? "Setting up..." : "Get Started Now"}
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Free to join. No minimum requirements.
        </p>
      </div>
    </div>
  );
}
