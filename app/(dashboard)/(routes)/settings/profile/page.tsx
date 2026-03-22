"use client";

import { useUser } from "@clerk/nextjs";
import { Globe, Link2, Instagram, Twitter } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useUser();
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Public Profile</h2>
          <p className="mt-1 text-sm text-zinc-400">
            This information will be visible to other users on your public profile.
          </p>
        </div>

        <div className="space-y-5">
          {/* Display name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Display Name
            </label>
            <input
              type="text"
              defaultValue={user?.fullName || ""}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
              placeholder="Your display name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 resize-none"
              placeholder="Tell others about yourself..."
              maxLength={160}
            />
            <p className="mt-1 text-xs text-zinc-500">{bio.length}/160</p>
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Social Links</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Add your social profiles to your public page.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Globe className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Instagram className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
              placeholder="@username"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Twitter className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
              placeholder="@username"
            />
          </div>
        </div>

        <button className="mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
          Save Changes
        </button>
      </div>
    </div>
  );
}
