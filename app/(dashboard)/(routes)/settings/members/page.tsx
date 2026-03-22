"use client";

import { Users, Mail, Shield, UserPlus } from "lucide-react";
import { useState } from "react";

export default function MembersPage() {
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold">Team Members</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Manage your team members and their access roles.
            </p>
          </div>
        </div>
      </div>

      {/* Invite */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <h3 className="text-base font-semibold mb-4">Invite Member</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
              placeholder="colleague@email.com"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
            <UserPlus className="h-4 w-4" />
            Invite
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <h3 className="text-base font-semibold mb-4">Current Members</h3>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
            <Shield className="h-6 w-6 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-zinc-200">No team members yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            Invite team members to collaborate on your workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
