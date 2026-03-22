"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Bell, BellOff, Palette } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const themes = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [generationNotifications, setGenerationNotifications] = useState(true);

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="mb-5 flex items-center gap-2">
          <Palette className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  isActive
                    ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-indigo-400")} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <div className="mb-5 flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Email notifications</p>
                <p className="text-xs text-zinc-500">Receive updates about your account via email</p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                emailNotifications ? "bg-indigo-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  emailNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <BellOff className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Generation alerts</p>
                <p className="text-xs text-zinc-500">Get notified when your generations complete</p>
              </div>
            </div>
            <button
              onClick={() => setGenerationNotifications(!generationNotifications)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                generationNotifications ? "bg-indigo-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  generationNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
