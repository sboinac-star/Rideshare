"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { locations } from "@/lib/constants";
import { formatDateTime, minDepartureTime, shareText } from "@/lib/utils";
import { Journey } from "@/lib/types";
import { useToast } from "@/app/ToastProvider";
import { useAuth } from "@/app/AuthProvider";
import SignInModal from "@/app/SignInModal";

export default function DriverPage() {
  const toast = useToast();
  const { user, authLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ departureTime: "", availableSeats: 1 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [newJourney, setNewJourney] = useState({
    driverName: "",
    from: "",
    to: "",
    pickupAddress: "",
    dropoffAddress: "",
    departureTime: "",
    availableSeats: 1,
    roundTrip: false,
    returnTime: "",
  });
  const [fromCustom, setFromCustom] = useState(false);
  const [toCustom, setToCustom] = useState(false);
  const [nameError, setNameError] = useState("");

  const validateName = (value: string) => {
    if (!value) return "Name is required";
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces";
    return "";
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, "journeys"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Journey))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a, b) => ((b as any).createdAt?.seconds ?? 0) - ((a as any).createdAt?.seconds ?? 0));
      setJourneys(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [user]);

  const handlePostJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowSignIn(true); return; }
    const err = validateName(newJourney.driverName);
    setNameError(err);
    if (err || !newJourney.from || !newJourney.to || !newJourney.departureTime) return;
    if (new Date(newJourney.departureTime) <= new Date()) {
      toast("Departure time must be in the future.", "error");
      return;
    }

    const isDuplicate = journeys.some(
      (j) => j.status === "active" && j.from === newJourney.from &&
             j.to === newJourney.to && j.departureTime === newJourney.departureTime
    );
    if (isDuplicate) {
      toast("You already have an active journey with the same route and time.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, "journeys"), {
        ...newJourney,
        driverPhone: user.phoneNumber ?? "",
        uid: user.uid,
        status: "active",
        createdAt: serverTimestamp(),
      });
      setSuccessId(ref.id);
      setNewJourney({ driverName: "", from: "", to: "", pickupAddress: "", dropoffAddress: "", departureTime: "", availableSeats: 1, roundTrip: false, returnTime: "" });
      setFromCustom(false);
      setToCustom(false);
      setNameError("");
      toast("Journey posted! Passengers can now find you.");
    } catch {
      toast("Failed to post journey. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelJourney = async (journeyId: string) => {
    if (!confirm("Are you sure you want to cancel this journey?")) return;
    try {
      await updateDoc(doc(db, "journeys", journeyId), { status: "cancelled" });
      toast("Journey cancelled.");
    } catch {
      toast("Failed to cancel. Please try again.", "error");
    }
  };

  const handleDeleteJourney = async (journeyId: string) => {
    if (!confirm("Permanently delete this journey? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "journeys", journeyId));
      toast("Journey deleted.");
    } catch {
      toast("Failed to delete. Please try again.", "error");
    }
  };

  const handleShare = async (journey: Journey) => {
    const url = `${window.location.origin}/journey/${journey.id}`;
    const text = shareText(journey, url);
    if (navigator.share) {
      await navigator.share({ title: `${journey.from} → ${journey.to}`, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(journey.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleEditSave = async (journeyId: string) => {
    if (!editData.departureTime) return;
    try {
      await updateDoc(doc(db, "journeys", journeyId), {
        departureTime: editData.departureTime,
        availableSeats: editData.availableSeats,
      });
      setEditingId(null);
      toast("Journey updated.");
    } catch {
      toast("Failed to update. Please try again.", "error");
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🚗</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to Post a Journey</h2>
          <p className="text-gray-500 text-sm mb-6">
            Verify your phone number once. Your number stays private — passengers contact you through the app.
          </p>
          <button
            onClick={() => setShowSignIn(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            Sign in with Phone
          </button>
          <p className="mt-4 text-xs text-gray-400">Already browsing? <Link href="/" className="text-blue-600 hover:underline">View all rides</Link></p>
        </div>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} title="Sign in with Phone" />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a Journey</h1>
          <span className="text-sm text-gray-500">
            {user.phoneNumber ? `●●●● ${user.phoneNumber.slice(-4)}` : ""}
          </span>
        </div>

        {successId ? (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your journey is live!</h2>
            <p className="text-gray-500 text-sm mb-6">Passengers can now find and contact you.</p>
            <div className="flex justify-center gap-3">
              <Link href={`/journey/${successId}`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition">
                View listing
              </Link>
              <button
                onClick={() => setSuccessId(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg transition"
              >
                Post another
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
            <form onSubmit={handlePostJourney} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  value={newJourney.driverName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setNewJourney({ ...newJourney, driverName: val });
                    setNameError(validateName(val));
                  }}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${nameError ? "border-red-500" : "border-gray-300"}`}
                  required
                />
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select
                    value={fromCustom ? "Other" : newJourney.from}
                    onChange={(e) => {
                      if (e.target.value === "Other") { setFromCustom(true); setNewJourney({ ...newJourney, from: "" }); }
                      else { setFromCustom(false); setNewJourney({ ...newJourney, from: e.target.value }); }
                    }}
                    className={inputClass}
                    required={!fromCustom}
                  >
                    <option value="">Select departure location</option>
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                    <option value="Other">Other (enter manually)</option>
                  </select>
                  {fromCustom && (
                    <input
                      type="text"
                      value={newJourney.from}
                      onChange={(e) => setNewJourney({ ...newJourney, from: e.target.value })}
                      placeholder="Enter departure city"
                      className={`mt-2 ${inputClass}`}
                      required
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select
                    value={toCustom ? "Other" : newJourney.to}
                    onChange={(e) => {
                      if (e.target.value === "Other") { setToCustom(true); setNewJourney({ ...newJourney, to: "" }); }
                      else { setToCustom(false); setNewJourney({ ...newJourney, to: e.target.value }); }
                    }}
                    className={inputClass}
                    required={!toCustom}
                  >
                    <option value="">Select destination</option>
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                    <option value="Other">Other (enter manually)</option>
                  </select>
                  {toCustom && (
                    <input
                      type="text"
                      value={newJourney.to}
                      onChange={(e) => setNewJourney({ ...newJourney, to: e.target.value })}
                      placeholder="Enter destination city"
                      className={`mt-2 ${inputClass}`}
                      required
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={newJourney.pickupAddress}
                    onChange={(e) => setNewJourney({ ...newJourney, pickupAddress: e.target.value })}
                    placeholder="e.g. 123 Main St, near Walmart"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={newJourney.dropoffAddress}
                    onChange={(e) => setNewJourney({ ...newJourney, dropoffAddress: e.target.value })}
                    placeholder="e.g. XNA Airport, Terminal A"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newJourney.departureTime}
                    min={minDepartureTime()}
                    onChange={(e) => setNewJourney({ ...newJourney, departureTime: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                  <select
                    value={newJourney.availableSeats}
                    onChange={(e) => setNewJourney({ ...newJourney, availableSeats: Number(e.target.value) })}
                    className={inputClass}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newJourney.roundTrip}
                  onChange={(e) => setNewJourney({
                    ...newJourney,
                    roundTrip: e.target.checked,
                    returnTime: "",
                  })}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">Round trip — I also need a return ride</span>
              </label>

              {newJourney.roundTrip && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newJourney.returnTime}
                    min={newJourney.departureTime || minDepartureTime()}
                    onChange={(e) => setNewJourney({ ...newJourney, returnTime: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                {submitting ? "Posting..." : "Post Journey"}
              </button>
            </form>
          </div>
        )}

        {!loading && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Journeys</h2>
            {journeys.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <p className="text-lg mb-1">No journeys yet</p>
                <p className="text-sm">Post your first journey above to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {journeys
                  .filter((j) => {
                    if (j.status === "active") return true;
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return new Date(j.departureTime) > sevenDaysAgo;
                  })
                  .map((journey) => (
                    <div key={journey.id} className="bg-white rounded-lg shadow p-6">
                      {editingId === journey.id ? (
                        <div className="space-y-3">
                          <p className="font-semibold text-gray-900">{journey.from} → {journey.to}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Departure Date & Time</label>
                              <input
                                type="datetime-local"
                                value={editData.departureTime}
                                onChange={(e) => setEditData({ ...editData, departureTime: e.target.value })}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Available Seats</label>
                              <select
                                value={editData.availableSeats}
                                onChange={(e) => setEditData({ ...editData, availableSeats: Number(e.target.value) })}
                                className={inputClass}
                              >
                                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSave(journey.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-4 rounded transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-1 px-4 rounded transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">{journey.from} → {journey.to}</p>
                            {journey.pickupAddress && <p className="text-gray-500 text-xs">From: {journey.pickupAddress}</p>}
                            {journey.dropoffAddress && <p className="text-gray-500 text-xs">To: {journey.dropoffAddress}</p>}
                            <p className="text-gray-600 text-sm">{formatDateTime(journey.departureTime)}</p>
                            <p className="text-gray-600 text-sm">{journey.driverName} · {journey.availableSeats} seats available</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              journey.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                            </span>
                            <div className="flex gap-2">
                              {journey.status === "active" && (
                                <>
                                  <button
                                    onClick={() => handleShare(journey)}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1 px-3 rounded transition"
                                  >
                                    {copiedId === journey.id ? "✓" : "📤"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(journey.id);
                                      setEditData({ departureTime: journey.departureTime, availableSeats: journey.availableSeats });
                                    }}
                                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleCancelJourney(journey.id)}
                                    className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteJourney(journey.id)}
                                className="text-sm border border-red-300 text-red-600 hover:bg-red-50 font-bold py-1 px-3 rounded transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
