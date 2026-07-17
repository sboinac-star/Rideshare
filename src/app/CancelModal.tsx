"use client";

import { useState } from "react";

const CANCEL_REASONS = [
  "Driver unavailable",
  "Passenger unavailable",
  "Plans changed",
  "Found another ride",
  "Weather or emergency",
  "Other",
];

type Props = {
  listingType: "journey" | "request";
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

export default function CancelModal({ listingType, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");

  const label = listingType === "journey" ? "journey" : "request";
  const finalReason = reason === "Other" ? (other.trim() || "Other") : reason;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Cancel {label}</h2>
        <p className="text-sm text-gray-500">Please select a reason for cancelling.</p>

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a reason…</option>
          {CANCEL_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {reason === "Other" && (
          <input
            type="text"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Please describe…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={200}
          />
        )}

        <div className="flex gap-3 mt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Keep
          </button>
          <button
            onClick={() => onConfirm(finalReason)}
            disabled={!reason}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium transition"
          >
            Cancel {label}
          </button>
        </div>
      </div>
    </div>
  );
}
