"use client";

import { useUserContext } from "@/components/layout/user-context";
import {
  Image,
  Video,
  Brush,
  WandSparkles,
  Layers,
  Pencil,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

type ToolUsage = {
  tool: string;
  count: number;
  creditsUsed: number;
};

const toolMeta: Record<string, { label: string; icon: typeof Image }> = {
  IMAGE_GENERATOR: { label: "Image Generation", icon: Image },
  VIDEO_GENERATOR: { label: "Video Generation", icon: Video },
  FACE_ENHANCE: { label: "Face Enhance", icon: Brush },
  FACE_SWAP: { label: "Face Swap", icon: WandSparkles },
  IMAGE_UPSCALER: { label: "Image Upscale", icon: Layers },
  IMAGE_EDITOR: { label: "Image Editor", icon: Pencil },
  PROMPT_GENERATOR: { label: "Prompt Generator", icon: MessageSquare },
  PROMPT_OPTIMIZER: { label: "Prompt Optimizer", icon: MessageSquare },
  AVATAR_TO_VIDEO: { label: "Avatar to Video", icon: Video },
  AVATAR_TRAINING: { label: "Avatar Training", icon: WandSparkles },
};

export default function UsagePage() {
  const { availableCredit, totalCredit, dailyUsage, isLoading } = useUserContext();
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(true);

  const creditPercent = totalCredit
    ? Math.round(((availableCredit || 0) / totalCredit) * 100)
    : 0;
  const creditsUsed = (totalCredit || 0) - (availableCredit || 0);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await axios.get("/api/user/tools-usage");
        setToolUsage(res.data?.usage || []);
      } catch {
        // Usage data not available
      } finally {
        setLoadingUsage(false);
      }
    };
    fetchUsage();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-[#0f1016]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
            Credits Used
          </p>
          <p className="text-2xl font-bold">{creditsUsed}</p>
          <p className="mt-1 text-xs text-zinc-500">of {totalCredit || 0} total</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
            Credits Remaining
          </p>
          <p className="text-2xl font-bold text-indigo-400">{availableCredit ?? 0}</p>
          <p className="mt-1 text-xs text-zinc-500">{creditPercent}% remaining</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
            Today&apos;s Usage
          </p>
          <p className="text-2xl font-bold">{dailyUsage?.creditUsed ?? 0}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {dailyUsage?.imageUsed ?? 0} generations today
          </p>
        </div>
      </div>

      {/* Credit bar */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium">Monthly Credit Usage</span>
          </div>
          <span className="text-sm text-zinc-400">{creditPercent}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
            style={{ width: `${100 - creditPercent}%` }}
          />
        </div>
      </div>

      {/* Tool breakdown */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1016] p-6">
        <h3 className="text-base font-semibold mb-4">Usage by Tool</h3>

        {loadingUsage ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : toolUsage.length === 0 ? (
          <p className="text-sm text-zinc-400">No usage data yet. Start generating to see your breakdown.</p>
        ) : (
          <div className="space-y-2">
            {toolUsage.map((item) => {
              const meta = toolMeta[item.tool] || {
                label: item.tool,
                icon: Image,
              };
              const Icon = meta.icon;
              return (
                <div
                  key={item.tool}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Icon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-200">{meta.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.count} runs</p>
                    <p className="text-xs text-zinc-500">{item.creditsUsed} credits</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
