"use client";

import { useState } from "react";
import Link from "next/link";

interface Booking {
  id: string;
  journeyId: string;
  driverName: string;
  driverRating: number;
  from: string;
  to: string;
  departureTime: string;
  seats: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

export default function RidesPage() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "1",
      journeyId: "j1",
      driverName: "John Smith",
      driverRating: 4.8,
      from: "Fayetteville",
      to: "Bentonville",
      departureTime: "2025-05-08 14:30",
      seats: 1,
      status: "confirmed",
    },
    {
      id: "2",
      journeyId: "j2",
      driverName: "Sarah Johnson",
      driverRating: 4.9,
      from: "Rogers",
      to: "Little Rock",
      departureTime: "2025-05-10 09:00",
      seats: 1,
      status: "pending",
    },
    {
      id: "3",
      journeyId: "j3",
      driverName: "Mike Davis",
      driverRating: 4.6,
      from: "Springdale",
      to: "Fayetteville",
      departureTime: "2025-04-15 18:45",
      seats: 1,
      status: "completed",
    },
  ]);

  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings(
      bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" } : b
      )
    );
    alert("Booking cancelled");
  };

  const handleContactDriver = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    alert(
      `Contact ${booking.driverName}\n\nRoute: ${booking.from} → ${booking.to}\nTime: ${booking.departureTime}\nSeats: ${booking.seats}\n\nDiscuss price directly with the driver.`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No bookings yet. Find a journey to book!</p>
              <Link
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Browse Journeys
              </Link>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.from} → {booking.to}
                    </h3>
                    <p className="text-gray-600 text-sm">{booking.departureTime}</p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Driver</p>
                    <p className="font-semibold text-gray-900">{booking.driverName}</p>
                    <p className="text-sm text-yellow-600">★ {booking.driverRating}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seats Booked</p>
                    <p className="font-semibold text-gray-900">{booking.seats}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900">
                      {booking.status === "pending" && "Waiting for driver approval"}
                      {booking.status === "confirmed" && "Confirmed"}
                      {booking.status === "completed" && "Completed"}
                      {booking.status === "cancelled" && "Cancelled"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => handleContactDriver(booking.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      Contact Driver
                    </button>
                  )}

                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleContactDriver(booking.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex-1"
                      >
                        Contact Driver
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex-1"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}

                  {booking.status === "completed" && (
                    <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition flex-1">
                      Rate Driver
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Browse Journeys
          </Link>
        </div>
      </div>
    </div>
  );
}
