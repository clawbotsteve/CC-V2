"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type SubmissionStatus = "pending" | "approved" | "rejected";

type CreatorSubmission = {
  id: string;
  userId: string;
  fullName: string;
  status: SubmissionStatus;
  mediaUrls: string[];
  createdAt: string;
  reviewNotes: string | null;
};

export default function AdminSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/submissions", { params: { status: statusFilter } });
      setSubmissions(res.data?.submissions || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const review = async (id: string, status: "approved" | "rejected") => {
    await axios.post(`/api/admin/submissions/${id}/review`, {
      status,
      reviewNotes: reviewNotes[id] || "",
    });
    await load();
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin • Creator Submissions</h1>
          <p className="mt-1 text-sm text-zinc-400">Review incoming creator media submissions.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111118]">
        <div className="grid grid-cols-[1.4fr_1fr_120px_120px_1.2fr] gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wide text-zinc-400">
          <div>Creator</div>
          <div>User ID</div>
          <div>Status</div>
          <div>Media</div>
          <div>Review Action</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-zinc-400">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-400">No submissions found.</div>
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="grid grid-cols-[1.4fr_1fr_120px_120px_1.2fr] gap-3 border-b border-white/5 px-4 py-4 text-sm">
              <div>
                <p className="font-medium text-white">{s.fullName}</p>
                <p className="text-xs text-zinc-400">{new Date(s.createdAt).toLocaleString()}</p>
              </div>
              <div className="truncate text-zinc-300">{s.userId}</div>
              <div className="capitalize text-zinc-200">{s.status}</div>
              <div className="text-zinc-200">{s.mediaUrls?.length || 0}</div>
              <div className="space-y-2">
                <input
                  value={reviewNotes[s.id] || ""}
                  onChange={(e) => setReviewNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  placeholder="Review notes"
                  className="w-full rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => review(s.id, "approved")}
                    className="rounded-md bg-lime-400 px-2 py-1 text-xs font-semibold text-black"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => review(s.id, "rejected")}
                    className="rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
