"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { locations } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface Journey {
  id: string;
  driverName: string;
  from: string;
  to: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  departureTime: string;
  availableSeats: number;
  status: "active" | "cancelled";
  driverPhone: string;
}

export default function DriverPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ departureTime: "", availableSeats: 1 });

  const [newJourney, setNewJourney] = useState({
    driverName: "",
    from: "",
    to: "",
    pickupAddress: "",
    dropoffAddress: "",
    departureTime: "",
    availableSeats: 1,
    driverPhone: "",
  });
  const [fromCustom, setFromCustom] = useState(false);
  const [toCustom, setToCustom] = useState(false);
  const [errors, setErrors] = useState({ driverName: "", driverPhone: "" });

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
    const q = query(collection(db, "journeys"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Journey));
      setJourneys(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const handlePostJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateName(newJourney.driverName);
    const phoneError = validatePhone(newJourney.driverPhone);
    setErrors({ driverName: nameError, driverPhone: phoneError });
    if (nameError || phoneError || !newJourney.from || !newJourney.to || !newJourney.departureTime) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "journeys"), {
        ...newJourney,
        status: "active",
        createdAt: serverTimestamp(),
      });
      setNewJourney({ driverName: "", from: "", to: "", pickupAddress: "", dropoffAddress: "", departureTime: "", availableSeats: 1, driverPhone: "" });
      setFromCustom(false);
      setToCustom(false);
      setErrors({ driverName: "", driverPhone: "" });
      alert(`Journey posted!\n\n${newJourney.driverName}: ${newJourney.from} → ${newJourney.to}\n${formatDateTime(newJourney.departureTime)}\n\nPassengers can contact you directly to negotiate price.`);
    } catch {
      alert("Failed to post journey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelJourney = async (journeyId: string) => {
    if (!confirm("Are you sure you want to cancel this journey?")) return;
    try {
      await updateDoc(doc(db, "journeys", journeyId), { status: "cancelled" });
    } catch {
      alert("Failed to cancel journey. Please try again.");
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
    } catch {
      alert("Failed to update journey. Please try again.");
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Post a Journey</h1>

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
                  setErrors((prev) => ({ ...prev, driverName: validateName(val) }));
                }}
                placeholder="Enter your full name"
                className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.driverName ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {errors.driverName && <p className="text-red-500 text-xs mt-1">{errors.driverName}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select
                  value={fromCustom ? "Other" : newJourney.from}
                  onChange={(e) => {
                    if (e.target.value === "Other") {
                      setFromCustom(true);
                      setNewJourney({ ...newJourney, from: "" });
                    } else {
                      setFromCustom(false);
                      setNewJourney({ ...newJourney, from: e.target.value });
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
                    if (e.target.value === "Other") {
                      setToCustom(true);
                      setNewJourney({ ...newJourney, to: "" });
                    } else {
                      setToCustom(false);
                      setNewJourney({ ...newJourney, to: e.target.value });
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone Number *</label>
              <input
                type="tel"
                value={newJourney.driverPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d\s\-()+]/g, "");
                  setNewJourney({ ...newJourney, driverPhone: val });
                  setErrors((prev) => ({ ...prev, driverPhone: validatePhone(val) }));
                }}
                placeholder="(479) 555-0123"
                className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.driverPhone ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {errors.driverPhone
                ? <p className="text-red-500 text-xs mt-1">{errors.driverPhone}</p>
                : <p className="text-xs text-gray-500 mt-1">Passengers will contact you directly to negotiate price and details</p>
              }
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {submitting ? "Posting..." : "Post Journey"}
            </button>
          </form>
        </div>

        {!loading && journeys.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Journeys</h2>
            <div className="space-y-4">
              {journeys.map((journey) => (
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
                        <p className="text-gray-600 text-sm">{journey.driverName} · {journey.driverPhone}</p>
                        <p className="text-gray-600 text-sm">{journey.availableSeats} seats available</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          journey.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                        </span>
                        {journey.status === "active" && (
                          <div className="flex gap-2">
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
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
