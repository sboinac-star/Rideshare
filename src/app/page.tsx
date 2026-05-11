"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Journey {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  from: string;
  to: string;
  departureTime: string;
  availableSeats: number;
  rideType: "local" | "intercity";
  vehicle: string;
  driverPhone: string;
}

export default function Home() {
  const [journeys, setJourneys] = useState<Journey[]>([
    {
      id: "1",
      driverId: "driver1",
      driverName: "John Smith",
      driverRating: 4.8,
      from: "Fayetteville",
      to: "Bentonville",
      departureTime: "2025-05-08 14:30",
      availableSeats: 2,
      rideType: "local",
      vehicle: "2022 Honda Civic (Silver)",
      driverPhone: "(479) 555-0123",
    },
    {
      id: "2",
      driverId: "driver2",
      driverName: "Sarah Johnson",
      driverRating: 4.9,
      from: "Rogers",
      to: "Little Rock",
      departureTime: "2025-05-10 09:00",
      availableSeats: 3,
      rideType: "intercity",
      vehicle: "2021 Toyota Camry (Blue)",
      driverPhone: "(479) 555-0456",
    },
    {
      id: "3",
      driverId: "driver3",
      driverName: "Mike Davis",
      driverRating: 4.6,
      from: "Springdale",
      to: "Fayetteville",
      departureTime: "2025-05-09 18:45",
      availableSeats: 1,
      rideType: "local",
      vehicle: "2023 Mazda 3 (Red)",
      driverPhone: "(479) 555-0789",
    },
  ]);

  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [filteredJourneys, setFilteredJourneys] = useState(journeys);

  useEffect(() => {
    const filtered = journeys.filter((journey) => {
      const fromMatch = journey.from.toLowerCase().includes(searchFrom.toLowerCase());
      const toMatch = journey.to.toLowerCase().includes(searchTo.toLowerCase());
      return fromMatch && toMatch;
    });
    setFilteredJourneys(filtered);
  }, [searchFrom, searchTo, journeys]);

  const handleBookJourney = (journeyId: string) => {
    const journey = journeys.find((j) => j.id === journeyId);
    if (!journey) return;

    alert(
      `Journey interest confirmed!\n\nRoute: ${journey.from} → ${journey.to}\nDeparture: ${journey.departureTime}\nDriver: ${journey.driverName}\n\n📞 Driver's Phone: ${journey.driverPhone}\n\nCall or text the driver to arrange your ride and negotiate pricing!`
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
            Share rides across Northwest Arkansas. Affordable travel with verified drivers.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/driver"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Post a Journey
            </Link>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Journeys</h3>
            <p className="text-gray-600">Find available rides posted by verified drivers</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Book & Confirm</h3>
            <p className="text-gray-600">Reserve your seat and wait for driver approval</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Fair Pricing</h3>
            <p className="text-gray-600">Save money by sharing rides with others</p>
          </div>
        </div>

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
            {filteredJourneys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg">No journeys found matching your search</p>
              </div>
            ) : (
              filteredJourneys.map((journey) => (
                <div
                  key={journey.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="grid md:grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          👤
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{journey.driverName}</p>
                          <p className="text-sm text-yellow-600">★ {journey.driverRating}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{journey.vehicle}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Route</p>
                      <p className="font-semibold text-gray-900">
                        {journey.from} → {journey.to}
                      </p>
                      <p className="text-sm text-gray-600">{journey.departureTime}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Available Seats</p>
                      <p className="font-semibold text-gray-900">{journey.availableSeats} seats</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        journey.rideType === "local"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {journey.rideType === "local" ? "Local" : "Intercity"}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleBookJourney(journey.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                      >
                        📞 Call Driver
                      </button>
                      <p className="text-xs text-gray-500 text-center">
                        Direct phone contact available
                      </p>
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
