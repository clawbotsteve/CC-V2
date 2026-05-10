"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/components/layout/user-context";
import { CURRENT_TERMS_VERSION } from "@/constants/constants";

/**
 * Three-checkbox attestation gate. Shown automatically the first time
 * an authed user lands inside the dashboard. Cannot be dismissed
 * without accepting; clicking outside or hitting Escape is a no-op
 * because the modal is non-closable until all three boxes are ticked
 * and the API call succeeds.
 *
 * Bumping `CURRENT_TERMS_VERSION` in constants/constants.ts re-prompts
 * existing users for re-acceptance.
 */
export default function TermsAttestationModal() {
  const { userId, meta, refetch, isLoading } = useUserContext();

  const [open, setOpen] = useState(false);
  const [age, setAge] = useState(false);
  const [likeness, setLikeness] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decide whether to show the modal:
  //   - User must be signed in (userId present)
  //   - User-info hydration must be complete (avoid flicker)
  //   - User has not accepted the CURRENT terms version
  useEffect(() => {
    if (isLoading) return;
    if (!userId) return;
    const accepted = !!meta?.termsAcceptedAt && meta?.termsVersion === CURRENT_TERMS_VERSION;
    setOpen(!accepted);
  }, [userId, isLoading, meta?.termsAcceptedAt, meta?.termsVersion]);

  const allChecked = age && likeness && terms;

  const handleSubmit = async () => {
    if (!allChecked || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageConfirmed: age,
          likenessConfirmed: likeness,
          termsConfirmed: terms,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      // Re-pull user-info so the gate clears across the app.
      refetch?.();
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Couldn't save acceptance. Try again?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      // Block Escape / outside-click — acceptance is required.
      onOpenChange={(next) => {
        if (next) setOpen(true);
      }}
    >
      <DialogContent
        className="max-w-lg border-white/10 bg-[#0f1016] p-0"
        // Remove the close (X) button by overriding the children-rendering logic.
        // shadcn's DialogContent renders a default close — hide it with CSS.
      >
        <div className="px-6 pt-6">
          <DialogTitle className="text-xl font-semibold text-white">
            Before you start using TaviraLabs
          </DialogTitle>
          <p className="mt-2 text-sm text-zinc-400">
            One-time confirmation. Required for everyone.
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          <CheckRow
            checked={age}
            onChange={setAge}
            label="I am at least 18 years old."
          />
          <CheckRow
            checked={likeness}
            onChange={setLikeness}
            label={
              <>
                I will not depict, recreate, or impersonate any real person, public
                figure, or persona without their <strong className="text-zinc-100">explicit written consent</strong>.
              </>
            }
          />
          <CheckRow
            checked={terms}
            onChange={setTerms}
            label={
              <>
                I have read and agree to the{" "}
                <Link href="/terms" target="_blank" className="text-emerald-300 underline hover:text-emerald-200">
                  Terms of Service
                </Link>
                ,{" "}
                <Link href="/privacy" target="_blank" className="text-emerald-300 underline hover:text-emerald-200">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link href="/aup" target="_blank" className="text-emerald-300 underline hover:text-emerald-200">
                  Acceptable Use Policy
                </Link>
                .
              </>
            }
          />
        </div>

        {error && (
          <p className="px-6 text-xs text-red-400">{error}</p>
        )}

        <div className="border-t border-white/10 bg-black/30 px-6 py-4 flex items-center justify-end gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!allChecked || submitting}
            className="bg-emerald-400 text-black hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/30"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "I agree — continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
        checked ? "border-emerald-400/50 bg-emerald-400/5" : "border-white/10 hover:border-white/20"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-emerald-400"
      />
      <span className="text-sm text-zinc-200 leading-relaxed">{label}</span>
    </label>
  );
}
