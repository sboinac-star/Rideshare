"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { locations } from "@/lib/constants";
import { formatDateTime, formatPhone, minDepartureTime, shareRequestText } from "@/lib/utils";
import { RideRequest } from "@/lib/types";
import { useToast } from "@/app/ToastProvider";

export default function PassengerPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<RideRequest[]>([]);
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
    passengerPhone: "",
    roundTrip: false,
  });
  const [fromCustom, setFromCustom] = useState(false);
  const [toCustom, setToCustom] = useState(false);
  const [errors, setErrors] = useState({ passengerName: "", passengerPhone: "" });

  const validateName = (value: string) => {
    if (!value) return "Name is required";
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces";
    return "";
  };

  const validatePhone = (value: string) => {
    if (!value) return "Phone number is required";
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) return "Enter a valid phone number (at least 10 digits)";
    return "";
  };

  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RideRequest));
      setRequests(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateName(newRequest.passengerName);
    const phoneError = validatePhone(newRequest.passengerPhone);
    setErrors({ passengerName: nameError, passengerPhone: phoneError });
    if (nameError || phoneError || !newRequest.from || !newRequest.to || !newRequest.departureTime) return;

    const isDuplicate = requests.some(
      (r) => r.status === "active" && r.from === newRequest.from && r.to === newRequest.to &&
             r.departureTime === newRequest.departureTime && r.passengerPhone === newRequest.passengerPhone
    );
    if (isDuplicate) {
      alert("You already have an active request with the same route, time and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, "requests"), {
        ...newRequest,
        status: "active",
        createdAt: serverTimestamp(),
      });
      setSuccessId(ref.id);
      setNewRequest({ passengerName: "", from: "", to: "", pickupAddress: "", dropoffAddress: "", departureTime: "", seatsNeeded: 1, passengerPhone: "", roundTrip: false });
      setFromCustom(false);
      setToCustom(false);
      setErrors({ passengerName: "", passengerPhone: "" });
      toast("Request posted! Drivers can now contact you.");
    } catch {
      toast("Failed to post request. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      await updateDoc(doc(db, "requests", requestId), { status: "cancelled" });
      toast("Request cancelled.");
    } catch {
      toast("Failed to cancel request. Please try again.", "error");
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
      await updateDoc(doc(db, "requests", requestId), {
        departureTime: editData.departureTime,
        seatsNeeded: editData.seatsNeeded,
      });
      setEditingId(null);
      toast("Request updated.");
    } catch {
      toast("Failed to update request. Please try again.", "error");
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Request a Ride</h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <form onSubmit={handlePostRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
              <input
                type="text"
                value={newRequest.passengerName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setNewRequest({ ...newRequest, passengerName: val });
                  setErrors((prev) => ({ ...prev, passengerName: validateName(val) }));
                }}
                placeholder="Enter your full name"
                className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.passengerName ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {errors.passengerName && <p className="text-red-500 text-xs mt-1">{errors.passengerName}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select
                  value={fromCustom ? "Other" : newRequest.from}
                  onChange={(e) => {
                    if (e.target.value === "Other") {
                      setFromCustom(true);
                      setNewRequest({ ...newRequest, from: "" });
                    } else {
                      setFromCustom(false);
                      setNewRequest({ ...newRequest, from: e.target.value });
                    }
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
                    if (e.target.value === "Other") {
                      setToCustom(true);
                      setNewRequest({ ...newRequest, to: "" });
                    } else {
                      setToCustom(false);
                      setNewRequest({ ...newRequest, to: e.target.value });
                    }
                  }}
                  className={inputClass}
                  required={!toCustom}
                >
                  <option value="">Select destination location</option>
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
                  min={minDepartureTime()}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone Number *</label>
              <input
                type="tel"
                value={newRequest.passengerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d\s\-()+]/g, "");
                  setNewRequest({ ...newRequest, passengerPhone: val });
                  setErrors((prev) => ({ ...prev, passengerPhone: validatePhone(val) }));
                }}
                placeholder="(479) 555-0123"
                className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.passengerPhone ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {errors.passengerPhone
                ? <p className="text-red-500 text-xs mt-1">{errors.passengerPhone}</p>
                : <p className="text-xs text-gray-500 mt-1">Drivers will contact you directly to confirm and negotiate price</p>
              }
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newRequest.roundTrip}
                onChange={(e) => setNewRequest({ ...newRequest, roundTrip: e.target.checked })}
                className="w-4 h-4 accent-purple-600"
              />
              <span className="text-sm text-gray-700">Round trip — I also need a return ride</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {submitting ? "Posting..." : "Post Request"}
            </button>
          </form>
        </div>

        {successId && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-purple-800">Your request is live!</p>
              <p className="text-sm text-purple-700">Drivers can now find and contact you.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/request/${successId}`} className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded transition">
                View listing
              </Link>
              <button onClick={() => setSuccessId(null)} className="text-sm text-purple-700 hover:text-purple-900">✕</button>
            </div>
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
                          <div className="grid grid-cols-2 gap-3">
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
                              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-1 px-4 rounded transition"
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
                            <p className="font-semibold text-lg text-gray-900">{req.from} → {req.to}</p>
                            {req.pickupAddress && <p className="text-gray-500 text-xs">From: {req.pickupAddress}</p>}
                            {req.dropoffAddress && <p className="text-gray-500 text-xs">To: {req.dropoffAddress}</p>}
                            <p className="text-gray-600 text-sm">{formatDateTime(req.departureTime)}</p>
                            <p className="text-gray-600 text-sm">{req.passengerName} · {formatPhone(req.passengerPhone)}</p>
                            <p className="text-gray-600 text-sm">{req.seatsNeeded} {req.seatsNeeded === 1 ? "seat" : "seats"} needed</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              req.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                            {req.status === "active" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleShare(req)}
                                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1 px-3 rounded transition"
                                >
                                  {copiedId === req.id ? "✓" : "📤"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(req.id);
                                    setEditData({ departureTime: req.departureTime, seatsNeeded: req.seatsNeeded });
                                  }}
                                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCancelRequest(req.id)}
                                  className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
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
