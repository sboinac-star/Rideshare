"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";

interface Journey {
  id: string;
  driverName: string;
  from: string;
  to: string;
  departureTime: string;
  availableSeats: number;
  driverPhone: string;
  status: string;
}

export default function Home() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "journeys"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Journey));
      setJourneys(data);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredJourneys = journeys.filter((journey) => {
    const fromMatch = journey.from.toLowerCase().includes(searchFrom.toLowerCase());
    const toMatch = journey.to.toLowerCase().includes(searchTo.toLowerCase());
    return fromMatch && toMatch;
  });

  const handleContactDriver = (journeyId: string) => {
    const journey = journeys.find((j) => j.id === journeyId);
    if (!journey) return;
    alert(
      `Route: ${journey.from} → ${journey.to}\nDeparture: ${journey.departureTime}\nDriver: ${journey.driverName}\n\nDriver's Phone: ${journey.driverPhone}\n\nCall or text the driver to arrange your ride and negotiate pricing!`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Carpooling Made Simple
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Share rides across the USA. Affordable travel made easy.
          </p>
          <Link
            href="/driver"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Post a Journey
          </Link>
        </section>


        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Find a Journey</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">From</label>
              <input
                type="text"
                placeholder="Departure city"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">To</label>
              <input
                type="text"
                placeholder="Destination city"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading journeys...</p>
              </div>
            ) : filteredJourneys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg">
                  {journeys.length === 0 ? "No journeys posted yet" : "No journeys found matching your search"}
                </p>
              </div>
            ) : (
              filteredJourneys.map((journey) => (
                <div key={journey.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <div className="grid md:grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">👤</div>
                        <p className="font-semibold text-gray-900">{journey.driverName}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Route</p>
                      <p className="font-semibold text-gray-900">{journey.from} → {journey.to}</p>
                      <p className="text-sm text-gray-600">{journey.departureTime}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Available Seats</p>
                      <p className="font-semibold text-gray-900">{journey.availableSeats} seats</p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleContactDriver(journey.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                      >
                        📞 Call Driver
                      </button>
                      <p className="text-xs text-gray-500 text-center">Direct phone contact</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
