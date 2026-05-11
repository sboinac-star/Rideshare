"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

interface Journey {
  id: string;
  driverName: string;
  from: string;
  to: string;
  departureTime: string;
  availableSeats: number;
  status: "active" | "cancelled";
  driverPhone: string;
}

export default function DriverPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newJourney, setNewJourney] = useState({
    driverName: "",
    from: "",
    to: "",
    departureTime: "",
    availableSeats: 1,
    driverPhone: "",
  });

  const locations = [
    "Atlanta", "Austin", "Bella Vista", "Bentonville", "Boston",
    "Canehill", "Charlotte", "Chicago", "Dallas", "Decatur",
    "Denver", "Elkins", "Eureka Springs", "Farmington", "Fayetteville",
    "Gentry", "Gravette", "Greenland", "Houston", "Huntsville",
    "Johnson", "Kansas City", "Las Vegas", "Lincoln", "Little Rock",
    "Los Angeles", "Maysville", "Memphis", "Miami", "Nashville",
    "New Orleans", "New York", "Oklahoma City", "Phoenix", "Prairie Grove",
    "Rogers", "San Francisco", "Seattle", "Siloam Springs", "Springdale",
    "St. Louis", "Tulsa", "Washington DC", "West Fork",
  ];

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
    if (!newJourney.driverName || !newJourney.from || !newJourney.to || !newJourney.departureTime || !newJourney.driverPhone) {
      alert("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "journeys"), {
        ...newJourney,
        status: "active",
        createdAt: serverTimestamp(),
      });
      setNewJourney({ driverName: "", from: "", to: "", departureTime: "", availableSeats: 1, driverPhone: "" });
      alert(`Journey posted!\n\n${newJourney.driverName}: ${newJourney.from} → ${newJourney.to}\n${newJourney.departureTime}\n\nPassengers can contact you directly to negotiate price.`);
    } catch {
      alert("Failed to post journey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelJourney = async (journeyId: string) => {
    try {
      await updateDoc(doc(db, "journeys", journeyId), { status: "cancelled" });
    } catch {
      alert("Failed to cancel journey. Please try again.");
    }
  };

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
                onChange={(e) => setNewJourney({ ...newJourney, driverName: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select
                  value={newJourney.from}
                  onChange={(e) => setNewJourney({ ...newJourney, from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select departure location</option>
                  {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select
                  value={newJourney.to}
                  onChange={(e) => setNewJourney({ ...newJourney, to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select destination location</option>
                  {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  value={newJourney.departureTime}
                  onChange={(e) => setNewJourney({ ...newJourney, departureTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                <select
                  value={newJourney.availableSeats}
                  onChange={(e) => setNewJourney({ ...newJourney, availableSeats: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onChange={(e) => setNewJourney({ ...newJourney, driverPhone: e.target.value })}
                placeholder="(479) 555-0123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Passengers will contact you directly to negotiate price and details</p>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg text-gray-900">{journey.from} → {journey.to}</p>
                      <p className="text-gray-600 text-sm">{journey.departureTime}</p>
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
                        <button
                          onClick={() => handleCancelJourney(journey.id)}
                          className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
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
