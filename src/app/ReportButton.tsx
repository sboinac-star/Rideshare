"use client";

import { useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";

const REASONS = [
  "Scam or fraud",
  "Fake listing",
  "Harassment",
  "No-show",
  "Unsafe behavior",
  "Other",
];

type Props = {
  listingId: string;
  listingType: "journey" | "request";
};

export default function ReportButton({ listingId, listingType }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, listingType, reason, details }),
      });
      if (res.status === 409) { toast("You already reported this listing.", "error"); setOpen(false); return; }
      if (!res.ok) throw new Error();
      toast("Report submitted. Our team will review it shortly.");
      setOpen(false);
    } catch {
      toast("Failed to submit report.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1"
        title="Report this listing"
      >
        🚩 Report
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Report this listing</h2>
              <p className="text-sm text-gray-500 mt-0.5">Help keep the community safe. Our team will review your report.</p>
            </div>

            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-red-500"
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>

            {reason === "Other" && (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe the issue (max 500 chars)"
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold rounded-lg transition text-sm"
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
