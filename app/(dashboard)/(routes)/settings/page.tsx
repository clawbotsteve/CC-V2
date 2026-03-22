"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

type SubmissionStatus = "pending" | "approved" | "rejected";

type CreatorSubmission = {
  id: string;
  fullName: string;
  notes: string | null;
  status: SubmissionStatus;
  mediaUrls: string[];
  createdAt: string;
  reviewNotes: string | null;
};

const statusConfig = {
  pending: {
    label: "Pending review",
    className: "bg-amber-500/15 text-amber-300 border border-amber-300/30",
    icon: Clock3,
  },
  approved: {
    label: "Approved",
    className: "bg-lime-500/15 text-lime-300 border border-lime-300/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-500/15 text-rose-300 border border-rose-300/30",
    icon: XCircle,
  },
} as const;

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [notes, setNotes] = useState("");
  const [mediaUrlsInput, setMediaUrlsInput] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaCount = useMemo(
    () => mediaUrlsInput.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).length,
    [mediaUrlsInput]
  );

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/submissions/me");
      setSubmissions(res.data?.submissions || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/submissions", {
        fullName,
        notes,
        mediaUrls: mediaUrlsInput,
        consentAccepted,
        rightsConfirmed,
      });

      setFullName("");
      setNotes("");
      setMediaUrlsInput("");
      setConsentAccepted(false);
      setRightsConfirmed(false);
      await loadSubmissions();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Creator Submissions</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Submit creator media for Tavira review. Approved submissions can be used for AI image/video workflows.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#111118] p-6">
        <h2 className="text-xl font-semibold">New Submission</h2>
        <p className="mt-1 text-sm text-zinc-400">Provide the creator details and media links (one URL per line).</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Creator full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#8b7bff]"
              placeholder="e.g. Ava Brooks"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-24 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#8b7bff]"
              placeholder="Style notes, niche, content intent, etc."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Media URLs ({mediaCount})</label>
            <textarea
              value={mediaUrlsInput}
              onChange={(e) => setMediaUrlsInput(e.target.value)}
              className="w-full min-h-28 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#8b7bff]"
              placeholder={"https://...\nhttps://..."}
              required
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5"
              required
            />
            I confirm this person has consented to AI processing and submission.
          </label>

          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(e) => setRightsConfirmed(e.target.checked)}
              className="mt-0.5"
              required
            />
            I own or have legal rights to submit and use this media.
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#7c68ff] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111118] p-6">
        <h2 className="text-xl font-semibold">Submission History</h2>
        <p className="mt-1 text-sm text-zinc-400">Track review status for your creator submissions.</p>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm text-zinc-400">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-sm text-zinc-400">No submissions yet.</div>
          ) : (
            submissions.map((submission) => {
              const cfg = statusConfig[submission.status];
              const Icon = cfg.icon;
              return (
                <div key={submission.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{submission.fullName}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(submission.createdAt).toLocaleString()} • {submission.mediaUrls?.length || 0} file(s)
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${cfg.className}`}>
                      <Icon className="h-3.5 w-3.5" /> {cfg.label}
                    </span>
                  </div>

                  {submission.notes && <p className="mt-2 text-sm text-zinc-300">{submission.notes}</p>}
                  {submission.reviewNotes && (
                    <p className="mt-2 text-xs text-zinc-400">Reviewer note: {submission.reviewNotes}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
