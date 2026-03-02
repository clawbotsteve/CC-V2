"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/mission-control/section-header";

const taskOptions = [
  { id: "image-speed", label: "Fast image generation" },
  { id: "image-consistency", label: "Character consistency images" },
  { id: "video-cinematic", label: "Cinematic short video" },
  { id: "video-motion", label: "Motion controlled video" },
  { id: "edit", label: "Advanced image editing" },
] as const;

const recommendations: Record<string, { model: string; tool: string; why: string }> = {
  "image-speed": {
    model: "Nano Banana Pro",
    tool: "Image Generator",
    why: "Best for fast high-quality first-pass outputs.",
  },
  "image-consistency": {
    model: "Flux LoRA",
    tool: "Image Generator",
    why: "Strongest option for repeatable character identity.",
  },
  "video-cinematic": {
    model: "Kling 2.6",
    tool: "Video Generation",
    why: "Balanced quality and motion for cinematic scenes.",
  },
  "video-motion": {
    model: "Kling Motion Control",
    tool: "Video Generation",
    why: "Best for controlled camera movement and direction.",
  },
  edit: {
    model: "Nano Banana Edit",
    tool: "Image Editor",
    why: "Most reliable for clean edit workflows and retouching.",
  },
};

export default function ModelRouterPage() {
  const [taskId, setTaskId] = useState<(typeof taskOptions)[number]["id"]>("image-speed");

  const recommendation = useMemo(() => recommendations[taskId], [taskId]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <SectionHeader title="Model Router" subtitle="Get the best model recommendation by workflow." />

      <div className="rounded-2xl border border-white/10 bg-[#111118] p-5">
        <p className="text-sm text-zinc-300 mb-3">Select your task:</p>
        <div className="flex flex-wrap gap-2">
          {taskOptions.map((task) => (
            <Button
              key={task.id}
              variant={taskId === task.id ? "default" : "outline"}
              onClick={() => setTaskId(task.id)}
            >
              {task.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111118] p-6">
        <p className="text-xs uppercase tracking-wider text-zinc-400">Recommendation</p>
        <h3 className="mt-2 text-2xl font-bold text-white">{recommendation.model}</h3>
        <p className="mt-1 text-sm text-zinc-300">Use in: {recommendation.tool}</p>
        <p className="mt-3 text-sm text-zinc-400">{recommendation.why}</p>
      </div>
    </div>
  );
}
