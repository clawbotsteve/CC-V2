import { SectionHeader } from "@/components/mission-control/section-header";
import { ToolCard } from "@/components/mission-control/tool-card";

const tools = [
  {
    href: "/mission-control/prompt-studio",
    title: "Prompt Studio",
    description: "Save and reuse high-performing prompt templates by category.",
  },
  {
    href: "/mission-control/batch-planner",
    title: "Content Batch Planner",
    description: "Plan campaign batches and track progress from idea to delivery.",
  },
  {
    href: "/mission-control/model-router",
    title: "Model Router",
    description: "Pick a task type and get the best tool/model recommendation fast.",
  },
];

export default function MissionControlPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <SectionHeader
        title="Mission Control"
        subtitle="Your custom ops center for CreatorCore workflows."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111118] p-5">
        <h3 className="text-lg font-semibold text-white">Recent activity</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Activity from Mission Control tools appears here as you build workflows.
        </p>
      </div>
    </div>
  );
}
