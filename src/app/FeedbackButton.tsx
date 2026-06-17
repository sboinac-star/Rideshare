"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/app/AuthProvider";

export default function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setOpen(false); setDone(false); setError(""); setText(""); };

  const submit = async () => {
    if (!text.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        text: text.trim(),
        uid: user?.uid ?? null,
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch {
      setError("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 transition"
      >
        💬 Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {done ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🙏</div>
                <p className="font-semibold text-gray-900">Thanks for your feedback!</p>
                <p className="text-sm text-gray-500 mt-1">We read every suggestion.</p>
                <button
                  onClick={reset}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Suggestions & Feedback</h2>
                  <button onClick={reset} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>
                <p className="text-sm text-gray-500 mb-4">Share a feature idea, report a problem, or tell us how we can improve.</p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. It would be great to filter rides by time of day..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <button
                  onClick={submit}
                  disabled={!text.trim() || submitting}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  {submitting ? "Sending…" : "Send Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
