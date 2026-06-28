"use client";

import { useState } from "react";
import { db, col } from "@/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { Journey, RideRequest } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/app/ToastProvider";

interface PendingItem {
  id: string;
  type: "journey" | "request";
  from: string;
  to: string;
  departureTime: string;
}

interface Props {
  items: PendingItem[];
  onDone: () => void;
}

export function getPendingCompletionItems(
  journeys: Journey[],
  requests: RideRequest[]
): PendingItem[] {
  const now = new Date();
  const pending: PendingItem[] = [];

  for (const j of journeys) {
    if (j.status === "active" && new Date(j.departureTime) < now) {
      pending.push({ id: j.id, type: "journey", from: j.from, to: j.to, departureTime: j.departureTime });
    }
  }
  for (const r of requests) {
    if (r.status === "active" && new Date(r.departureTime) < now) {
      pending.push({ id: r.id, type: "request", from: r.from, to: r.to, departureTime: r.departureTime });
    }
  }
  return pending;
}

export default function CompletionPromptModal({ items, onDone }: Props) {
  const toast = useToast();
  const [statuses, setStatuses] = useState<Record<string, "completed" | "cancelled" | "">>(() =>
    Object.fromEntries(items.map((i) => [i.id, ""]))
  );
  const [saving, setSaving] = useState(false);

  const allAnswered = items.every((i) => statuses[i.id] !== "");

  const handleSave = async () => {
    if (!allAnswered) return;
    setSaving(true);
    try {
      await Promise.all(
        items.map((item) =>
          updateDoc(doc(db, item.type === "journey" ? "journeys" : "requests", item.id), {
            status: statuses[item.id],
          })
        )
      );
      toast("Thanks for updating your ride status!");
      onDone();
    } catch {
      toast("Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🚗</div>
          <h2 className="text-xl font-bold text-gray-900">How did your ride go?</h2>
          <p className="text-sm text-gray-500 mt-1">
            Please update the status of your past {items.length > 1 ? "rides" : "ride"} before posting a new one.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {item.type === "journey" ? "Journey" : "Request"}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{item.from} → {item.to}</p>
              <p className="text-xs text-gray-500 mb-3">{formatDateTime(item.departureTime)}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatuses((s) => ({ ...s, [item.id]: "completed" }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition ${
                    statuses[item.id] === "completed"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-green-300"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatuses((s) => ({ ...s, [item.id]: "cancelled" }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition ${
                    statuses[item.id] === "cancelled"
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-600 hover:border-red-300"
                  }`}
                >
                  Did not happen
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!allAnswered || saving}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
        {!allAnswered && (
          <p className="text-center text-xs text-gray-400 mt-2">Please update all rides above to continue.</p>
        )}
      </div>
    </div>
  );
}
