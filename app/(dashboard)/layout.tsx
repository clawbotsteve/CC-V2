// app/(dashboard)/layout.tsx
import Link from "next/link";
import TopNavbar from "@/components/layout/top-navbar";
import { AffiliateCapture } from "@/components/affiliate/affiliate-capture";
import TermsAttestationModal from "@/components/legal/terms-attestation-modal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-y-auto flex flex-col">
      <TopNavbar />
      <AffiliateCapture />
      {/*
        Required attestation gate. Self-shows when the authed user hasn't
        accepted the current terms version; ships with the dashboard so it
        appears no matter which dashboard route the user lands on first.
      */}
      <TermsAttestationModal />
      <main className="pt-16 flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      <footer className="border-t border-zinc-800 mt-12 px-4 py-6 text-xs text-zinc-500">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} TraviaLabs. Service available in the United States.</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
            <Link href="/aup" className="hover:text-zinc-300">Acceptable Use</Link>
            <a href="mailto:abuse@taviralabsai.com" className="hover:text-zinc-300">Report abuse</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
