"use client";

import { useState } from "react";
import Link from "next/link";

interface Journey {
  id: string;
  driverName: string;
  from: string;
  to: string;
  departureTime: string;
  availableSeats: number;
  rideType: "local" | "intercity";
  status: "active" | "completed" | "cancelled";
  bookings: number;
  driverPhone: string;
}

export default function DriverPage() {
  const [journeys, setJourneys] = useState<Journey[]>([
    {
      id: "1",
      driverName: "John Smith",
      from: "Fayetteville",
      to: "Bentonville",
      departureTime: "2025-05-08 14:30",
      availableSeats: 2,
      rideType: "local",
      status: "active",
      bookings: 1,
      driverPhone: "(479) 555-0123",
    },
  ]);

  const [showPostForm, setShowPostForm] = useState(false);
  const [newJourney, setNewJourney] = useState({
    driverName: "",
    from: "",
    to: "",
    departureTime: "",
    availableSeats: 1,
    rideType: "local" as "local" | "intercity",
    driverPhone: "",
  });

  // Common locations across the USA
  const locations = [
    "Atlanta",
    "Austin",
    "Bella Vista",
    "Bentonville",
    "Boston",
    "Canehill",
    "Charlotte",
    "Chicago",
    "Dallas",
    "Decatur",
    "Denver",
    "Elkins",
    "Eureka Springs",
    "Farmington",
    "Fayetteville",
    "Gentry",
    "Gravette",
    "Greenland",
    "Houston",
    "Huntsville",
    "Johnson",
    "Kansas City",
    "Las Vegas",
    "Lincoln",
    "Little Rock",
    "Los Angeles",
    "Maysville",
    "Memphis",
    "Miami",
    "Nashville",
    "New Orleans",
    "New York",
    "Oklahoma City",
    "Phoenix",
    "Prairie Grove",
    "Rogers",
    "San Francisco",
    "Seattle",
    "Siloam Springs",
    "Springdale",
    "St. Louis",
    "Tulsa",
    "Washington DC",
    "West Fork",
  ];

  const handlePostJourney = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newJourney.driverName ||
      !newJourney.from ||
      !newJourney.to ||
      !newJourney.departureTime ||
      !newJourney.driverPhone
    ) {
      alert("Please fill in all fields including your name and phone number");
      return;
    }

    const journey: Journey = {
      id: String(journeys.length + 1),
      ...newJourney,
      status: "active",
      bookings: 0,
    };

    setJourneys([...journeys, journey]);
    setNewJourney({
      driverName: "",
      from: "",
      to: "",
      departureTime: "",
      availableSeats: 1,
      rideType: "local",
      driverPhone: "",
    });
    setShowPostForm(false);

    alert(`Journey posted!\n\n${journey.driverName}: ${journey.from} → ${journey.to}\n${journey.departureTime}\n\nPhone: ${journey.driverPhone}\n\nPassengers can contact you directly to negotiate price.`);
  };

  const handleCancelJourney = (journeyId: string) => {
    setJourneys(
      journeys.map((j) =>
        j.id === journeyId ? { ...j, status: "cancelled" } : j
      )
    );
    alert("Journey cancelled");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Driver Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-blue-600 mb-2">
              {journeys.filter((j) => j.status === "active").length}
            </p>
            <p className="text-gray-600">Active Journeys</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-green-600 mb-2">
              {journeys.reduce((sum, j) => sum + j.bookings, 0)}
            </p>
            <p className="text-gray-600">Total Bookings</p>
          </div>
        </div>

        <div className="mb-8">
          {!showPostForm && (
            <button
              onClick={() => setShowPostForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              + Post New Journey
            </button>
          )}

          {showPostForm && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Post a New Journey</h2>

              <form onSubmit={handlePostJourney} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={newJourney.driverName}
                    onChange={(e) =>
                      setNewJourney({ ...newJourney, driverName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From
                    </label>
                    <select
                      value={newJourney.from}
                      onChange={(e) =>
                        setNewJourney({ ...newJourney, from: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select departure location</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To
                    </label>
                    <select
                      value={newJourney.to}
                      onChange={(e) =>
                        setNewJourney({ ...newJourney, to: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select destination location</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newJourney.departureTime}
                    onChange={(e) =>
                      setNewJourney({ ...newJourney, departureTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Seats
                    </label>
                    <select
                      value={newJourney.availableSeats}
                      onChange={(e) =>
                        setNewJourney({
                          ...newJourney,
                          availableSeats: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "seat" : "seats"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trip Type
                    </label>
                    <select
                      value={newJourney.rideType}
                      onChange={(e) =>
                        setNewJourney({
                          ...newJourney,
                          rideType: e.target.value as "local" | "intercity",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="local">Local</option>
                      <option value="intercity">Intercity</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newJourney.driverPhone}
                    onChange={(e) =>
                      setNewJourney({ ...newJourney, driverPhone: e.target.value })
                    }
                    placeholder="(479) 555-0123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Passengers will contact you directly via this phone number to negotiate price and details
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition flex-1"
                  >
                    Post Journey
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPostForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Journeys</h2>

          {journeys.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No journeys posted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {journeys.map((journey) => (
                <div key={journey.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="grid md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm text-gray-600">Driver</p>
                      <p className="font-semibold text-gray-900">{journey.driverName}</p>
                      <p className="text-sm text-gray-600 mt-1">Route</p>
                      <p className="font-semibold text-lg text-gray-900">
                        {journey.from} → {journey.to}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Departure</p>
                      <p className="font-semibold text-gray-900">
                        {journey.departureTime}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Bookings</p>
                      <p className="font-semibold text-gray-900">
                        {journey.bookings}/{journey.availableSeats} seats
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(journey.bookings / journey.availableSeats) * 100}%`,
                          }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                        journey.rideType === "local"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {journey.rideType === "local" ? "Local" : "Intercity"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className={`text-center font-semibold px-3 py-1 rounded-full text-sm ${
                        journey.rideType === "local"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {journey.rideType === "local" ? "Local" : "Intercity"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className={`text-center font-semibold px-3 py-1 rounded-full text-sm ${
                        journey.status === "active"
                          ? "bg-green-100 text-green-800"
                          : journey.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                      </span>

                      {journey.status === "active" && (
                        <button
                          onClick={() => handleCancelJourney(journey.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
