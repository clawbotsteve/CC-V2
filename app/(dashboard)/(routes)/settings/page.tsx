"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock3, Plus, Sparkles, Upload, UserRound, X, XCircle } from "lucide-react";
import { uploadFiles } from "@/lib/utils";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "submissions" | "image" | "video" | "projects">("all");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mediaCount = useMemo(() => selectedFiles.length, [selectedFiles]);

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
      if (selectedFiles.length < 1) {
        setError("Please add at least one photo");
        return;
      }

      const uploadResult = await uploadFiles({
        files: selectedFiles,
        maxFiles: 12,
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      });

      if ("error" in uploadResult) {
        setError(uploadResult.error || "Upload failed");
        return;
      }

      const mediaUrls = (uploadResult.files || []).map((f) => f.url);

      await axios.post("/api/submissions", {
        fullName,
        notes,
        mediaUrls,
        consentAccepted,
        rightsConfirmed,
      });

      setFullName("");
      setNotes("");
      setSelectedFiles([]);
      setConsentAccepted(false);
      setRightsConfirmed(false);
      setError(null);
      await loadSubmissions();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === "all" || activeTab === "submissions") return true;
    if (activeTab === "image") return (s.mediaUrls?.length || 0) > 0;
    if (activeTab === "video") return false;
    if (activeTab === "projects") return false;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#0f1016] p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-lime-300/80 to-zinc-100 text-zinc-900">
              <UserRound className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Creator Profile</h1>
              <p className="mt-2 text-sm text-zinc-400 max-w-xl">
                Submit creator media for Tavira review. Approved submissions can be used for image and video generation workflows.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {[
                  { key: "all", label: "All" },
                  { key: "submissions", label: "Submissions" },
                  { key: "projects", label: "Projects" },
                  { key: "image", label: "Image" },
                  { key: "video", label: "Video" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`rounded-full border px-3 py-1 transition ${
                      activeTab === tab.key
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <Sparkles className="h-5 w-5 text-zinc-200" />
            </div>
            <p className="text-sm font-medium text-zinc-200">Add featured creator</p>
            <p className="mt-1 text-xs text-zinc-400">Highlight one approved creator profile here.</p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("submissions");
                fileInputRef.current?.click();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#b7ff3c] px-4 py-2 text-sm font-bold text-zinc-900"
            >
              <Plus className="h-4 w-4" /> Add creator
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#111118] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">New Submission</h2>
            <p className="mt-1 text-sm text-zinc-400">Provide the creator details and upload creator photos for review.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-zinc-300">
            <Sparkles className="h-3.5 w-3.5" /> Creator intake
          </span>
        </div>

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
            <label className="mb-2 block text-sm text-zinc-300">Creator Photos ({mediaCount})</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const incoming = Array.from(e.target.files || []);
                if (!incoming.length) return;
                setSelectedFiles((prev) => [...prev, ...incoming].slice(0, 12));
                e.currentTarget.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 px-4 py-6 text-sm text-zinc-300 hover:bg-white/5"
            >
              <Upload className="h-4 w-4" /> Click to add photos (max 12)
            </button>

            {selectedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {selectedFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-300">
                    <div className="truncate">{file.name}</div>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="mt-1 inline-flex items-center gap-1 text-rose-300 hover:text-rose-200"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-sm text-zinc-400">No items for this tab yet.</div>
          ) : (
            filteredSubmissions.map((submission) => {
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
