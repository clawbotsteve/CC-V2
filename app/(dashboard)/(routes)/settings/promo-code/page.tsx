"use client";

import { Tag, Gift, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

export default function PromoCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      await axios.post("/api/promo/redeem", { code: code.trim() });
      toast.success("Promo code redeemed successfully!");
      setCode("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Invalid promo code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Redeem card */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-bold">Promo Code</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-6">
          Enter a promo code to redeem credits or unlock discounts.
        </p>

        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="relative">
            <Gift className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-12 pr-4 text-base font-mono tracking-wider text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal"
              placeholder="Enter your promo code"
              maxLength={30}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Redeeming..."
            ) : (
              <>
                Redeem Code
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <h3 className="text-base font-semibold mb-3">How promo codes work</h3>
        <ul className="space-y-2.5 text-sm text-zinc-400">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            Promo codes can add bonus credits to your account
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            Some codes unlock special discounts on plan upgrades
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            Each code can only be used once per account
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            Credits from promo codes are added to your current balance
          </li>
        </ul>
      </div>
    </div>
  );
}
