import Link from "next/link";
import type { Metadata } from "next";
import { RideRequest } from "@/lib/types";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { parseValue, FirestoreValue } from "@/lib/firestore";
import RequestContact from "./RequestContact";

async function fetchRequest(id: string): Promise<RideRequest | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/requests/${id}?key=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const doc = await res.json() as { name: string; fields: Record<string, FirestoreValue> };
    const f = doc.fields;
    return {
      id,
      passengerName: String(parseValue(f.passengerName) ?? ""),
      from: String(parseValue(f.from) ?? ""),
      to: String(parseValue(f.to) ?? ""),
      pickupAddress: f.pickupAddress ? String(parseValue(f.pickupAddress)) : undefined,
      dropoffAddress: f.dropoffAddress ? String(parseValue(f.dropoffAddress)) : undefined,
      departureTime: String(parseValue(f.departureTime) ?? ""),
      seatsNeeded: Number(parseValue(f.seatsNeeded) ?? 1),
      uid: f.uid ? String(parseValue(f.uid)) : undefined,
      passengerPhone: String(parseValue(f.passengerPhone) ?? ""),
      status: String(parseValue(f.status) ?? ""),
      roundTrip: f.roundTrip ? Boolean(parseValue(f.roundTrip)) : undefined,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const req = await fetchRequest(id);
  if (!req) return { title: "Request Not Found — NWA Ride Share" };
  return {
    title: `Ride Needed: ${req.from} → ${req.to} — NWA Ride Share`,
    description: `${req.passengerName} needs a ride from ${req.from} to ${req.to} on ${formatDateTime(req.departureTime)}. ${req.seatsNeeded} seat${req.seatsNeeded !== 1 ? "s" : ""} needed.`,
    openGraph: {
      title: `🙋 Ride Needed: ${req.from} → ${req.to}`,
      description: `${formatDateTime(req.departureTime)} · ${req.seatsNeeded} seat${req.seatsNeeded !== 1 ? "s" : ""} needed`,
    },
  };
}

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const req = await fetchRequest(id);

  if (!req) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Request not found</p>
          <p className="text-gray-500 mb-6">It may have been cancelled or removed.</p>
          <Link href="/" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
            Browse All Rides
          </Link>
        </div>
      </div>
    );
  }

  if (req.status === "cancelled") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">This request was cancelled</p>
          <Link href="/" className="text-purple-600 hover:underline">
            Browse other rides →
          </Link>
        </div>
      </div>
    );
  }

  const rel = relativeTime(req.departureTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12">
      <div className="max-w-lg mx-auto px-4">
        <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm font-medium mb-6 inline-block">
          ← Back to browse
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl shrink-0">🙋</div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{req.passengerName}</p>
              <p className="text-gray-500 text-sm">Passenger</p>
            </div>
            {req.roundTrip && (
              <span className="ml-auto text-xs bg-purple-50 text-purple-700 font-medium px-2 py-1 rounded-full">↔ Round trip</span>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📍</span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Route</p>
                <p className="font-semibold text-gray-900 text-lg">{req.from} → {req.to}</p>
                {req.pickupAddress && <p className="text-sm text-gray-500">Pickup: {req.pickupAddress}</p>}
                {req.dropoffAddress && <p className="text-sm text-gray-500">Dropoff: {req.dropoffAddress}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📅</span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Travel Date</p>
                <p className="font-semibold text-gray-900">{formatDateTime(req.departureTime)}</p>
                {rel && <p className="text-sm text-purple-600 font-medium">{rel}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">💺</span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Seats Needed</p>
                <p className="font-semibold text-gray-900">{req.seatsNeeded} {req.seatsNeeded === 1 ? "seat" : "seats"}</p>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < req.seatsNeeded ? "bg-purple-400" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {req.uid ? (
            <RequestContact
              requestId={req.id}
              ownerUid={req.uid}
              passengerName={req.passengerName}
              route={`${req.from} → ${req.to}`}
            />
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
