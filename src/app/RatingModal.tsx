"use client";

import { useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";

type Props = {
  ratedUid: string;
  ratedName: string;
  journeyId: string;
  onClose: () => void;
};

export default function RatingModal({ ratedUid, ratedName, journeyId, onClose }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || score === 0) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ratedUid, journeyId, score, comment }),
      });
      if (res.status === 409) { toast("You already rated this ride.", "error"); onClose(); return; }
      if (!res.ok) throw new Error();
      toast("Rating submitted. Thank you!");
      onClose();
    } catch {
      toast("Failed to submit rating.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Rate {ratedName}</h2>
        <p className="text-sm text-gray-500 mb-4">How was your experience?</p>

        <div className="flex gap-2 justify-center mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition"
            >
              {s <= (hovered || score) ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment (max 200 chars)"
          maxLength={200}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={score === 0 || submitting}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-lg transition"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
