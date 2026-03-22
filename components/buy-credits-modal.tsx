"use client";

import { useState } from "react";
import { X, ArrowRight, Coins } from "lucide-react";
import { CREDIT_PACKS } from "@/constants";
import { useUserContext } from "@/components/layout/user-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = CREDIT_PACKS.map((p) => p.credits);

export function BuyCreditsModal({ open, onClose }: BuyCreditsModalProps) {
  const { plan } = useUserContext();
  const [selectedPack, setSelectedPack] = useState(CREDIT_PACKS[0]);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"credits" | "dollars">("credits");

  const isFree = !plan || plan === "plan_free";

  // Find the matching pack for a credit amount, or the closest larger one
  const findPack = (credits: number) => {
    const exact = CREDIT_PACKS.find((p) => p.credits === credits);
    if (exact) return exact;
    // Find smallest pack that covers the amount
    const sorted = [...CREDIT_PACKS].sort((a, b) => a.credits - b.credits);
    return sorted.find((p) => p.credits >= credits) || sorted[sorted.length - 1];
  };

  const handlePresetClick = (credits: number) => {
    const pack = findPack(credits);
    setSelectedPack(pack);
    setCustomAmount(String(credits));
  };

  const handleCustomChange = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    setCustomAmount(num);
    if (num) {
      const pack = findPack(parseInt(num, 10));
      setSelectedPack(pack);
    }
  };

  const handlePurchase = async () => {
    if (isFree) {
      toast.error("You must be on a paid plan to purchase credits.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/stripe/credit-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPack.id }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data?.error || "Failed to start checkout");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1016] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Buy Credits</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Purchase additional credits for your account.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toggle Credits / US Dollars */}
        <div className="mb-5 flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
          <button
            onClick={() => setMode("credits")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition",
              mode === "credits"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Coins className="mr-1.5 inline h-4 w-4" />
            Credits
          </button>
          <button
            onClick={() => setMode("dollars")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition",
              mode === "dollars"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            $ US Dollars
          </button>
        </div>

        {/* Amount input */}
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <label className="mb-2 block text-sm text-zinc-400">
            {mode === "credits" ? "Enter amount in credits" : "Select a credit pack"}
          </label>
          <input
            type="text"
            value={customAmount || String(selectedPack.credits)}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-lg font-bold text-zinc-100 outline-none transition focus:border-indigo-500/50"
            placeholder="Enter amount"
          />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-3 w-3 rounded-full border border-zinc-600 inline-flex items-center justify-center text-[8px]">i</span>
            Minimum purchase is ${CREDIT_PACKS[0].price}
          </p>
        </div>

        {/* Preset buttons */}
        <div className="mb-5 flex flex-wrap gap-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePresetClick(pack.credits)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                selectedPack.id === pack.id
                  ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                  : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              {pack.credits.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Price summary */}
        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">
              {selectedPack.credits.toLocaleString()} credits
            </span>
            <div className="flex items-center gap-2 text-zinc-400">
              <ArrowRight className="h-4 w-4" />
              <span className="text-lg font-bold text-white">
                ${selectedPack.price}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={loading || isFree}
          className={cn(
            "w-full rounded-xl py-3.5 text-sm font-bold transition",
            isFree
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-lime-400 text-black hover:bg-lime-300"
          )}
        >
          {loading
            ? "Redirecting to checkout..."
            : isFree
              ? "Upgrade to a paid plan first"
              : "Calculate final price"}
        </button>

        {isFree && (
          <p className="mt-3 text-center text-xs text-zinc-500">
            You must be on a paid plan to purchase credit packs.
          </p>
        )}
      </div>
    </div>
  );
}
