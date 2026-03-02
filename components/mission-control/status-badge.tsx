type Status = "todo" | "in-progress" | "done";

const statusMap: Record<Status, string> = {
  todo: "bg-zinc-700/50 text-zinc-200 border-zinc-500/40",
  "in-progress": "bg-amber-500/20 text-amber-200 border-amber-400/40",
  done: "bg-lime-500/20 text-lime-200 border-lime-400/40",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${statusMap[status]}`}>
      {status}
    </span>
  );
}

export type { Status };
