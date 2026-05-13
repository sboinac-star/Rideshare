import Link from "next/link";
import type { Metadata } from "next";
import { Journey } from "@/lib/types";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { parseValue, FirestoreValue } from "@/lib/firestore";
import JourneyContact from "@/features/chat/JourneyContact";
import DeleteListingButton from "@/features/listings/DeleteListingButton";

async function fetchJourney(id: string): Promise<Journey | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/journeys/${id}?key=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const doc = await res.json() as { name: string; fields: Record<string, FirestoreValue> };
    const f = doc.fields;
    return {
      id,
      driverName: String(parseValue(f.driverName) ?? ""),
      from: String(parseValue(f.from) ?? ""),
      to: String(parseValue(f.to) ?? ""),
      pickupAddress: f.pickupAddress ? String(parseValue(f.pickupAddress)) : undefined,
      dropoffAddress: f.dropoffAddress ? String(parseValue(f.dropoffAddress)) : undefined,
      departureTime: String(parseValue(f.departureTime) ?? ""),
      availableSeats: Number(parseValue(f.availableSeats) ?? 0),
      uid: f.uid ? String(parseValue(f.uid)) : undefined,
      driverPhone: String(parseValue(f.driverPhone) ?? ""),
      status: String(parseValue(f.status) ?? ""),
      roundTrip: f.roundTrip ? Boolean(parseValue(f.roundTrip)) : undefined,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const journey = await fetchJourney(id);
  if (!journey) return { title: "Journey Not Found — NWA Ride Share" };
  return {
    title: `${journey.from} → ${journey.to} — NWA Ride Share`,
    description: `${journey.driverName} is driving from ${journey.from} to ${journey.to} on ${formatDateTime(journey.departureTime)}. ${journey.availableSeats} seat${journey.availableSeats !== 1 ? "s" : ""} available.`,
    openGraph: {
      title: `🚗 ${journey.from} → ${journey.to}`,
      description: `${formatDateTime(journey.departureTime)} · ${journey.availableSeats} seat${journey.availableSeats !== 1 ? "s" : ""} available`,
    },
  };
}

export default async function JourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const journey = await fetchJourney(id);

  if (!journey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Journey not found</p>
          <p className="text-gray-500 mb-6">It may have been cancelled or removed.</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition">
            Browse All Rides
          </Link>
        </div>
      </div>
    );
  }

  if (journey.status === "cancelled") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">This journey was cancelled</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Browse other rides →
          </Link>
        </div>
      </div>
    );
  }

  const rel = relativeTime(journey.departureTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-lg mx-auto px-4">
        <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6 inline-block">
          ← Back to browse
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl shrink-0">👤</div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{journey.driverName}</p>
              <p className="text-gray-500 text-sm">Driver</p>
            </div>
            {journey.roundTrip && (
              <span className="ml-auto text-xs bg-blue-50 text-blue-700 font-medium px-2 py-1 rounded-full">↔ Round trip</span>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📍</span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Route</p>
                <p className="font-semibold text-gray-900 text-lg">{journey.from} → {journey.to}</p>
                {journey.pickupAddress && <p className="text-sm text-gray-500">Pickup: {journey.pickupAddress}</p>}
                {journey.dropoffAddress && <p className="text-sm text-gray-500">Dropoff: {journey.dropoffAddress}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📅</span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Departure</p>
                <p className="font-semibold text-gray-900">{formatDateTime(journey.departureTime)}</p>
                {rel && <p className="text-sm text-blue-600 font-medium">{rel}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">💺</span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Available Seats</p>
                <p className="font-semibold text-gray-900">{journey.availableSeats} {journey.availableSeats === 1 ? "seat" : "seats"}</p>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < journey.availableSeats ? "bg-green-500" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {journey.uid ? (
            <>
              <JourneyContact
                journeyId={journey.id}
                ownerUid={journey.uid}
                driverName={journey.driverName}
                route={`${journey.from} → ${journey.to}`}
              />
              <DeleteListingButton collection="journeys" docId={journey.id} ownerUid={journey.uid} />
            </>
          ) : (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-center text-gray-500 text-sm">Contact information unavailable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
