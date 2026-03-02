"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/mission-control/empty-state";
import { SectionHeader } from "@/components/mission-control/section-header";
import { StatusBadge, Status } from "@/components/mission-control/status-badge";
import { loadFromStorage, saveToStorage } from "@/lib/mission-control/storage";

type BatchTask = {
  id: string;
  title: string;
  status: Status;
};

const STORAGE_KEY = "mission-control.batch-planner";

export default function BatchPlannerPage() {
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setTasks(loadFromStorage<BatchTask[]>(STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, tasks);
  }, [tasks]);

  const addTask = () => {
    if (!title.trim()) return;
    setTasks((prev) => [{ id: crypto.randomUUID(), title: title.trim(), status: "todo" }, ...prev]);
    setTitle("");
  };

  const cycleStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const next: Record<Status, Status> = {
          todo: "in-progress",
          "in-progress": "done",
          done: "todo",
        };
        return { ...task, status: next[task.status] };
      })
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <SectionHeader title="Content Batch Planner" subtitle="Track campaign output from idea to publish." />

      <div className="rounded-2xl border border-white/10 bg-[#111118] p-5 flex gap-3">
        <Input
          placeholder="Add a batch task (e.g. 10 UGC skincare clips)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button onClick={addTask}>Add</Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Add your first batch item and start tracking progress." />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#111118] p-5 space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => cycleStatus(task.id)}
              className="w-full text-left rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-black/35 transition flex items-center justify-between gap-3"
            >
              <span className="text-sm text-white">{task.title}</span>
              <StatusBadge status={task.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
