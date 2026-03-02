import Link from "next/link";

type ToolCardProps = {
  href: string;
  title: string;
  description: string;
  status?: string;
};

export function ToolCard({ href, title, description, status = "Ready" }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-white/10 bg-[#111118] p-5 transition hover:border-[#6366f1]/70 hover:bg-[#141424]"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="rounded-md bg-[#6366f1]/20 border border-[#6366f1]/40 px-2 py-0.5 text-xs font-semibold text-indigo-200">
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </Link>
  );
}
