"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, col } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { locations } from "@/lib/constants";
import { formatDateTime, minDepartureTime, shareRequestText } from "@/lib/utils";
import { RideRequest, Journey } from "@/lib/types";
import { useToast } from "@/app/ToastProvider";
import { useAuth } from "@/app/AuthProvider";
import SignInModal from "@/app/SignInModal";
import CompletionPromptModal, { getPendingCompletionItems } from "@/app/CompletionPromptModal";

export default function PassengerPage() {
  const toast = useToast();
  const { user, authLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [myJourneys, setMyJourneys] = useState<Journey[]>([]);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ departureTime: "", seatsNeeded: 1 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [newRequest, setNewRequest] = useState({
    passengerName: "",
    from: "",
    to: "",
    pickupAddress: "",
    dropoffAddress: "",
    departureTime: "",
    seatsNeeded: 1,
    roundTrip: false,
    returnTime: "",
  });
  const [fromCustom, setFromCustom] = useState(false);
  const [toCustom, setToCustom] = useState(false);
  const [nameError, setNameError] = useState("");
  const [minTime, setMinTime] = useState("");

  useEffect(() => { setMinTime(minDepartureTime()); }, []);

  const validateName = (value: string) => {
    if (!value) return "Name is required";
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces";
    return "";
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!user) { setLoading(false); return; }
    const unsubR = onSnapshot(
      query(collection(db, "requests"), where("uid", "==", user.uid)),
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as RideRequest))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a, b) => ((b as any).createdAt?.seconds ?? 0) - ((a as any).createdAt?.seconds ?? 0));
        setRequests(data);
        setLoading(false);
      }, () => setLoading(false));
    const unsubJ = onSnapshot(
      query(collection(db, "journeys"), where("uid", "==", user.uid)),
      (snapshot) => {
        setMyJourneys(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Journey)));
      });
    return () => { unsubR(); unsubJ(); };
  }, [user]);

  const doPostRequest = async () => {
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, "requests"), {
        ...newRequest,
        uid: user!.uid,
        status: "active",
        createdAt: serverTimestamp(),
      });
      setSuccessId(ref.id);
      setNewRequest({ passengerName: "", from: "", to: "", pickupAddress: "", dropoffAddress: "", departureTime: "", seatsNeeded: 1, roundTrip: false, returnTime: "" });
      setFromCustom(false);
      setToCustom(false);
      setNameError("");
      toast("Request posted! Drivers can now find you.");
    } catch (e) {
      console.error("[post-request]", e);
      toast(`Failed to post request: ${(e as { message?: string })?.message ?? e}`, "error");
    } finally {
      setSubmitting(false);
      setPendingSubmit(false);
    }
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowSignIn(true); return; }
    const err = validateName(newRequest.passengerName);
    setNameError(err);
    if (err || !newRequest.from || !newRequest.to || !newRequest.departureTime) return;
    if (new Date(newRequest.departureTime) <= new Date()) {
      toast("Travel time must be in the future.", "error");
      return;
    }
    const isDuplicate = requests.some(
      (r) => r.status === "active" && r.from === newRequest.from &&
             r.to === newRequest.to && r.departureTime === newRequest.departureTime
    );
    if (isDuplicate) {
      toast("You already have an active request with the same route and time.", "error");
      return;
    }
    const pending = getPendingCompletionItems(myJourneys, requests);
    if (pending.length > 0) {
      setPendingSubmit(true);
      setShowCompletionPrompt(true);
      return;
    }
    await doPostRequest();
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowSignIn(true); return; }
    const err = validateName(newRequest.passengerName);
    setNameError(err);
    if (err || !newRequest.from || !newRequest.to || !newRequest.departureTime) return;
    if (new Date(newRequest.departureTime) <= new Date()) {
      toast("Travel time must be in the future.", "error");
      return;
    }
    const isDuplicate = requests.some(
      (r) => r.status === "active" && r.from === newRequest.from &&
             r.to === newRequest.to && r.departureTime === newRequest.departureTime
    );
    if (isDuplicate) {
      toast("You already have an active request with the same route and time.", "error");
      return;
    }
    const pending = getPendingCompletionItems(myJourneys, requests);
    if (pending.length > 0) {
      setPendingSubmit(true);
      setShowCompletionPrompt(true);
      return;
    }
    await doPostRequest();
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      await updateDoc(doc(db, col("requests"), requestId), { status: "cancelled" });
      toast("Request cancelled.");
    } catch {
      toast("Failed to cancel. Please try again.", "error");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Permanently delete this request? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, col("requests"), requestId));
      toast("Request deleted.");
    } catch {
      toast("Failed to delete. Please try again.", "error");
    }
  };

  const handleShare = async (req: RideRequest) => {
    const url = `${window.location.origin}/request/${req.id}`;
    const text = shareRequestText(req, url);
    if (navigator.share) {
      await navigator.share({ title: `Ride Needed: ${req.from} → ${req.to}`, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(req.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleEditSave = async (requestId: string) => {
    if (!editData.departureTime) return;
    try {
      await updateDoc(doc(db, col("requests"), requestId), {
        departureTime: editData.departureTime,
        seatsNeeded: editData.seatsNeeded,
      });
      setEditingId(null);
      toast("Request updated.");
    } catch {
      toast("Failed to update. Please try again.", "error");
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500";

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
          <div className="text-5xl mb-4">🙋</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to Request a Ride</h2>
          <p className="text-gray-500 text-sm mb-6">
            Verify your phone number once. Your number stays private — drivers contact you through the app.
          </p>
          <button
            onClick={() => setShowSignIn(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
          >
            Sign in with Phone
          </button>
          <p className="mt-4 text-xs text-gray-400">Already browsing? <Link href="/" className="text-blue-600 hover:underline">View all rides</Link></p>
        </div>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} title="Sign in with Phone" />}
      </div>
    );
  }

  const pendingItems = getPendingCompletionItems(myJourneys, requests);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {showCompletionPrompt && pendingItems.length > 0 && (
        <CompletionPromptModal
          items={pendingItems}
          onDone={() => {
            setShowCompletionPrompt(false);
            if (pendingSubmit) doPostRequest();
          }}
        />
      )}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Request a Ride</h1>
          <span className="text-sm text-gray-500">
            {user.phoneNumber ? `●●●● ${user.phoneNumber.slice(-4)}` : ""}
          </span>
        </div>

        {successId ? (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your request is live!</h2>
            <p className="text-gray-500 text-sm mb-6">Drivers can now find and contact you.</p>
            <div className="flex justify-center gap-3">
              <Link href={`/request/${successId}`} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg transition">
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
          <div className="bg-white rounded-lg shadow-lg p-5 sm:p-8 mb-10">
            <form onSubmit={handlePostRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  value={newRequest.passengerName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setNewRequest({ ...newRequest, passengerName: val });
                    setNameError(validateName(val));
                  }}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${nameError ? "border-red-500" : "border-gray-300"}`}
                  required
                />
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select
                    value={fromCustom ? "Other" : newRequest.from}
                    onChange={(e) => {
                      if (e.target.value === "Other") { setFromCustom(true); setNewRequest({ ...newRequest, from: "" }); }
                      else { setFromCustom(false); setNewRequest({ ...newRequest, from: e.target.value }); }
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
                      value={newRequest.from}
                      onChange={(e) => setNewRequest({ ...newRequest, from: e.target.value })}
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
                    value={toCustom ? "Other" : newRequest.to}
                    onChange={(e) => {
                      if (e.target.value === "Other") { setToCustom(true); setNewRequest({ ...newRequest, to: "" }); }
                      else { setToCustom(false); setNewRequest({ ...newRequest, to: e.target.value }); }
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
                      value={newRequest.to}
                      onChange={(e) => setNewRequest({ ...newRequest, to: e.target.value })}
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
                    value={newRequest.pickupAddress}
                    onChange={(e) => setNewRequest({ ...newRequest, pickupAddress: e.target.value })}
                    placeholder="e.g. 123 Main St, near Walmart"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={newRequest.dropoffAddress}
                    onChange={(e) => setNewRequest({ ...newRequest, dropoffAddress: e.target.value })}
                    placeholder="e.g. XNA Airport, Terminal A"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newRequest.departureTime}
                    min={minTime}
                    onChange={(e) => setNewRequest({ ...newRequest, departureTime: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats Needed</label>
                  <select
                    value={newRequest.seatsNeeded}
                    onChange={(e) => setNewRequest({ ...newRequest, seatsNeeded: Number(e.target.value) })}
                    className={inputClass}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newRequest.roundTrip}
                  onChange={(e) => setNewRequest({
                    ...newRequest,
                    roundTrip: e.target.checked,
                    returnTime: "",
                  })}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm text-gray-700">Round trip — I also need a return ride</span>
              </label>

              {newRequest.roundTrip && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newRequest.returnTime}
                    min={newRequest.departureTime || minTime}
                    onChange={(e) => setNewRequest({ ...newRequest, returnTime: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                {submitting ? "Posting..." : "Post Request"}
              </button>
            </form>
          </div>
        )}

        {!loading && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Requests</h2>
            {requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <p className="text-lg mb-1">No requests yet</p>
                <p className="text-sm">Post your first ride request above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests
                  .filter((r) => {
                    if (r.status === "active") return true;
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return new Date(r.departureTime) > sevenDaysAgo;
                  })
                  .map((req) => (
                    <div key={req.id} className="bg-white rounded-lg shadow p-6">
                      {editingId === req.id ? (
                        <div className="space-y-3">
                          <p className="font-semibold text-gray-900">{req.from} → {req.to}</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Travel Date & Time</label>
                              <input
                                type="datetime-local"
                                value={editData.departureTime}
                                onChange={(e) => setEditData({ ...editData, departureTime: e.target.value })}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Seats Needed</label>
                              <select
                                value={editData.seatsNeeded}
                                onChange={(e) => setEditData({ ...editData, seatsNeeded: Number(e.target.value) })}
                                className={inputClass}
                              >
                                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSave(req.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2 px-4 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">{req.from} → {req.to}</p>
                            {req.pickupAddress && <p className="text-gray-500 text-xs">From: {req.pickupAddress}</p>}
                            {req.dropoffAddress && <p className="text-gray-500 text-xs">To: {req.dropoffAddress}</p>}
                            <p className="text-gray-600 text-sm">{formatDateTime(req.departureTime)}</p>
                            <p className="text-gray-600 text-sm">{req.passengerName} · {req.seatsNeeded} {req.seatsNeeded === 1 ? "seat" : "seats"} needed</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              req.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                            <div className="flex gap-2">
                              {req.status === "active" && (
                                <>
                                  <button
                                    onClick={() => handleShare(req)}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-lg transition"
                                  >
                                    {copiedId === req.id ? "✓" : "📤"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(req.id);
                                      setEditData({ departureTime: req.departureTime, seatsNeeded: req.seatsNeeded });
                                    }}
                                    className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleCancelRequest(req.id)}
                                    className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                className="text-sm border border-red-300 text-red-600 hover:bg-red-50 font-bold py-2 px-3 rounded-lg transition"
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
