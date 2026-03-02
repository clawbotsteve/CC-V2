import Link from "next/link";

export default function BatchOnboardingPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-black text-white">Batch Generation Onboarding</h1>
      <p className="mt-3 text-zinc-300">
        Tell us what you need, your intended use case, and your timeline. We review each request for legal and policy compliance before activation.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#111118] p-6">
        <p className="text-sm text-zinc-300">For now, send your request to:</p>
        <a className="mt-2 inline-block text-[#8b7bff] hover:underline" href="mailto:team@taviralabs.ai?subject=Batch%20Generation%20Onboarding">
          team@taviralabs.ai
        </a>
      </div>

      <Link href="/dashboard" className="mt-8 inline-block text-sm text-zinc-400 hover:text-white">
        ← Back to dashboard
      </Link>
    </div>
  );
}
