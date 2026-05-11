"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { locations } from "@/lib/constants";

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


function CityInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = value.trim()
    ? locations.filter((loc) => loc.toLowerCase().includes(value.toLowerCase()))
    : locations;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.length > 0
            ? suggestions.map((loc) => (
                <li
                  key={loc}
                  onMouseDown={() => { onChange(loc); setOpen(false); }}
                  className="px-4 py-2 text-gray-900 hover:bg-blue-50 cursor-pointer"
                >
                  {loc}
                </li>
              ))
            : value.trim() && (
                <li className="px-4 py-2 text-gray-500 italic text-sm">
                  No suggestions — searching for &quot;{value}&quot;
                </li>
              )
          }
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "journeys"),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Journey))
        .sort((a, b) => (b.departureTime > a.departureTime ? 1 : -1));
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
    const dateMatch = searchDate ? journey.departureTime.startsWith(searchDate) : true;
    return fromMatch && toMatch && dateMatch;
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

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">From</label>
              <CityInput value={searchFrom} onChange={setSearchFrom} placeholder="Departure city" />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">To</label>
              <CityInput value={searchTo} onChange={setSearchTo} placeholder="Destination city" />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Date</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
