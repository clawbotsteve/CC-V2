"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/mission-control/empty-state";
import { SectionHeader } from "@/components/mission-control/section-header";
import { loadFromStorage, saveToStorage } from "@/lib/mission-control/storage";

type PromptTemplate = {
  id: string;
  name: string;
  category: string;
  prompt: string;
};

const STORAGE_KEY = "mission-control.prompt-studio";

export default function PromptStudioPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    setTemplates(loadFromStorage<PromptTemplate[]>(STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, templates);
  }, [templates]);

  const grouped = useMemo(() => {
    return templates.reduce<Record<string, PromptTemplate[]>>((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [templates]);

  const createTemplate = () => {
    if (!name.trim() || !prompt.trim()) return;
    setTemplates((prev) => [
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        category: category.trim() || "General",
        prompt: prompt.trim(),
      },
      ...prev,
    ]);
    setName("");
    setPrompt("");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <SectionHeader title="Prompt Studio" subtitle="Save reusable prompt templates by category." />

      <div className="rounded-2xl border border-white/10 bg-[#111118] p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Category (UGC, Ads, Fashion...)" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <Textarea
          placeholder="Paste your reusable prompt template..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
        />
        <Button onClick={createTemplate}>Save template</Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState title="No templates yet" description="Create your first prompt template to speed up generation." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="rounded-2xl border border-white/10 bg-[#111118] p-5">
              <h3 className="text-white font-semibold">{group}</h3>
              <div className="mt-3 space-y-3">
                {items.map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{t.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
