"use client";

import { useState } from "react";
import { db, col } from "@/lib/firebase";
import { collection, query, where, orderBy, startAt, endAt, getDocs, limit } from "firebase/firestore";
import { useAuth } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";

type Person = { uid: string; name: string; role: string };

type Props = {
  listingId: string;
  onClose: () => void;
};

export default function RateSomeoneModal({ listingId, onClose }: Props) {
  const { user } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Person | null>(null);
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const term = search.trim();
      const end = term + "";

      const [jSnap, rSnap] = await Promise.all([
        getDocs(query(
          collection(db, col("journeys")),
          orderBy("driverName"),
          startAt(term), endAt(end),
          limit(5),
        )),
        getDocs(query(
          collection(db, col("requests")),
          orderBy("passengerName"),
          startAt(term), endAt(end),
          limit(5),
        )),
      ]);

      const seen = new Set<string>();
      const found: Person[] = [];

      jSnap.docs.forEach((d) => {
        const uid = d.data().uid as string | undefined;
        if (uid && uid !== user?.uid && !seen.has(uid)) {
          seen.add(uid);
          found.push({ uid, name: d.data().driverName as string, role: "Driver" });
        }
      });
      rSnap.docs.forEach((d) => {
        const uid = d.data().uid as string | undefined;
        if (uid && uid !== user?.uid && !seen.has(uid)) {
          seen.add(uid);
          found.push({ uid, name: d.data().passengerName as string, role: "Passenger" });
        }
      });

      setResults(found);
      if (found.length === 0) toast("No users found with that name.", "error");
    } catch {
      toast("Search failed. Please try again.", "error");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selected || score === 0) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ratedUid: selected.uid, journeyId: listingId, score, comment }),
      });
      if (res.status === 409) { toast("You already rated this person for this ride.", "error"); onClose(); return; }
      if (!res.ok) throw new Error();
      toast(`Rating submitted for ${selected.name}. Thank you!`);
      onClose();
    } catch {
      toast("Failed to submit rating.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rate your ride partner</h2>
          <p className="text-sm text-gray-500 mt-0.5">Search by the name of the person you rode with.</p>
        </div>

        {/* Search */}
        {!selected && (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Type a name…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !search.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition"
              >
                {searching ? "…" : "Search"}
              </button>
            </div>

            {results.length > 0 && (
              <div className="flex flex-col gap-2">
                {results.map((p) => (
                  <button
                    key={p.uid}
                    onClick={() => setSelected(p)}
                    className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.role}</p>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">Select →</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Rating */}
        {selected && (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
              <p className="text-sm font-medium text-gray-700">Rating <span className="text-gray-900">{selected.name}</span></p>
            </div>

            <div className="flex gap-2 justify-center">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Skip
          </button>
          {selected && (
            <button
              onClick={handleSubmit}
              disabled={score === 0 || submitting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-lg transition text-sm"
            >
              {submitting ? "Submitting…" : "Submit Rating"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
