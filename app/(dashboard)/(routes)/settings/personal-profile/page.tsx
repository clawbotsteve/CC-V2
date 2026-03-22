"use client";

import { useUser } from "@clerk/nextjs";
import { useUserContext } from "@/components/layout/user-context";
import { PlanLabel } from "@/components/plan-label";
import { Camera, Mail, AtSign, Shield } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export default function PersonalProfilePage() {
  const { user } = useUser();
  const { plan, availableCredit, totalCredit } = useUserContext();
  const [publishToExplore, setPublishToExplore] = useState(false);

  const isPremium = plan && plan !== "plan_free";

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="relative group">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-indigo-300">
                  {user?.firstName?.[0] || user?.username?.[0] || "?"}
                </div>
              )}
            </div>
            <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {user?.fullName || user?.username || "User"}
              </h1>
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs">
                <PlanLabel plan={plan} />
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          <button
            onClick={() => user?.update && window.open("https://accounts.clerk.dev", "_blank")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 transition"
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
          <div className="flex items-center gap-2 text-zinc-400 mb-3">
            <AtSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Username</span>
          </div>
          <p className="text-sm font-medium text-zinc-100">
            {user?.username || "Not set"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
          <div className="flex items-center gap-2 text-zinc-400 mb-3">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Email</span>
          </div>
          <p className="text-sm font-medium text-zinc-100">
            {user?.primaryEmailAddress?.emailAddress || "Not set"}
          </p>
        </div>
      </div>

      {/* Publish to explore */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Publish to explore</h3>
            <p className="mt-1 text-sm text-zinc-400">
              All your generations will be automatically published to the Explore page.
              {!isPremium && " Only premium users can disable this setting."}
            </p>
          </div>
          <button
            onClick={() => isPremium && setPublishToExplore(!publishToExplore)}
            disabled={!isPremium}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              publishToExplore
                ? "bg-indigo-500"
                : "bg-zinc-700"
            } ${!isPremium ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                publishToExplore ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-red-400" />
          <h3 className="text-base font-semibold text-red-300">Danger Zone</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          Sensitive account actions. These actions are irreversible.
        </p>
        <button className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 transition">
          Delete account
        </button>
      </div>
    </div>
  );
}
