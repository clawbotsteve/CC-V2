import Link from "next/link";

const LegalLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-[#111827] text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="text-zinc-400 hover:text-white">
            ← TaviraLabs
          </Link>
          <span className="text-zinc-600">|</span>
          <Link href="/terms" className="text-zinc-300 hover:text-white">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-zinc-300 hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/aup" className="text-zinc-300 hover:text-white">
            Acceptable Use Policy
          </Link>
        </nav>
        <article className="prose prose-invert max-w-none prose-headings:text-white prose-h1:text-3xl prose-h2:mt-10 prose-h2:text-xl prose-h2:font-semibold prose-h3:mt-6 prose-h3:text-base prose-h3:font-semibold prose-p:text-zinc-300 prose-p:leading-relaxed prose-li:text-zinc-300 prose-strong:text-white prose-a:text-indigo-300">
          {children}
        </article>
      </div>
    </main>
  );
};

export default LegalLayout;
