"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, where, addDoc, serverTimestamp } from "firebase/firestore";
import { locations } from "@/lib/constants";
import { formatDateTime, formatPhone, isPast, isToday, isThisWeekend, whatsappLink, shareText } from "@/lib/utils";

interface Journey {
  id: string;
  driverName: string;
  from: string;
  to: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  departureTime: string;
  availableSeats: number;
  driverPhone: string;
  status: string;
}

type QuickFilter = "all" | "today" | "weekend";

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
          {suggestions.map((loc) => (
            <li
              key={loc}
              onMouseDown={() => { onChange(loc); setOpen(false); }}
              className="px-4 py-2 text-gray-900 hover:bg-blue-50 cursor-pointer"
            >
              {loc}
            </li>
          ))}
          <li
            onMouseDown={() => { onChange(""); setOpen(false); }}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 cursor-pointer border-t border-gray-100 text-sm font-medium"
          >
            Other (enter manually)
          </li>
        </ul>
      )}
    </div>
  );
}

function SeatIcons({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mt-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`w-3 h-3 rounded-full ${i < count ? "bg-green-500" : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 md:p-6 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="w-3 h-3 bg-gray-200 rounded-full" />)}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 bg-gray-200 rounded-lg flex-1" />
        <div className="h-9 bg-gray-200 rounded-lg flex-1" />
        <div className="h-9 bg-gray-200 rounded-lg w-16" />
        <div className="h-9 bg-gray-200 rounded-lg w-16" />
      </div>
    </div>
  );
}

export default function Home() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [loading, setLoading] = useState(true);
  const [contactJourney, setContactJourney] = useState<Journey | null>(null);
  const [reportJourney, setReportJourney] = useState<Journey | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "journeys"), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Journey))
        .filter((j) => !isPast(j.departureTime))
        .sort((a, b) => (a.departureTime > b.departureTime ? 1 : -1));
      setJourneys(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const filteredJourneys = journeys.filter((journey) => {
    const fromText = `${journey.from} ${journey.pickupAddress ?? ""}`.toLowerCase();
    const toText = `${journey.to} ${journey.dropoffAddress ?? ""}`.toLowerCase();
    const fromMatch = fromText.includes(searchFrom.toLowerCase());
    const toMatch = toText.includes(searchTo.toLowerCase());
    const dateMatch = searchDate ? journey.departureTime.startsWith(searchDate) : true;
    const quickMatch =
      quickFilter === "today" ? isToday(journey.departureTime) :
      quickFilter === "weekend" ? isThisWeekend(journey.departureTime) : true;
    return fromMatch && toMatch && dateMatch && quickMatch;
  });

  const hasFilters = searchFrom || searchTo || searchDate || quickFilter !== "all";

  const handleShare = async (journey: Journey) => {
    const text = shareText(journey);
    await navigator.clipboard.writeText(text);
    setCopiedId(journey.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReport = async () => {
    if (!reportJourney || !reportReason) return;
    setReportSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        journeyId: reportJourney.id,
        reason: reportReason,
        createdAt: serverTimestamp(),
      });
      setReportJourney(null);
      setReportReason("");
      alert("Report submitted. Thank you.");
    } catch {
      alert("Failed to submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Carpooling Made Simple</h1>
          <p className="text-xl text-gray-600 mb-8">Share rides across the USA. Affordable travel made easy.</p>
          <Link href="/driver" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
            Post a Journey
          </Link>
        </section>

        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Find a Journey</h2>
            {!loading && (
              <span className="text-sm text-gray-500">
                {filteredJourneys.length} {filteredJourneys.length === 1 ? "journey" : "journeys"} available
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
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

          <div className="flex gap-2 mb-6">
            {(["all", "today", "weekend"] as QuickFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setQuickFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  quickFilter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f === "today" ? "Today" : "This Weekend"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : filteredJourneys.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-gray-600 text-lg">
                  {journeys.length === 0 ? "No journeys posted yet" : "No journeys match your search"}
                </p>
                {hasFilters && (
                  <button
                    onClick={() => { setSearchFrom(""); setSearchTo(""); setSearchDate(""); setQuickFilter("all"); }}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Clear filters
                  </button>
                )}
                <p className="text-gray-500 text-sm">
                  Want to travel?{" "}
                  <Link href="/driver" className="text-purple-600 hover:underline font-medium">Post a journey</Link>
                </p>
              </div>
            ) : (
              filteredJourneys.map((journey) => (
                <div key={journey.id} className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg shrink-0">👤</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{journey.driverName}</p>
                        <p className="font-semibold text-gray-800">{journey.from} → {journey.to}</p>
                        {journey.pickupAddress && <p className="text-xs text-gray-500">From: {journey.pickupAddress}</p>}
                        {journey.dropoffAddress && <p className="text-xs text-gray-500">To: {journey.dropoffAddress}</p>}
                        <p className="text-sm text-gray-600">{formatDateTime(journey.departureTime)}</p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <p className="text-sm text-gray-500">Available Seats</p>
                      <p className="font-semibold text-gray-900">{journey.availableSeats} seats</p>
                      <SeatIcons count={journey.availableSeats} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setContactJourney(journey)}
                      className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition text-sm"
                    >
                      📞 Call
                    </button>
                    <a
                      href={whatsappLink(journey.driverPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[100px] bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg transition text-sm text-center"
                    >
                      💬 WhatsApp
                    </a>
                    <button
                      onClick={() => handleShare(journey)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition text-sm"
                    >
                      {copiedId === journey.id ? "✓ Copied" : "📤 Share"}
                    </button>
                    <button
                      onClick={() => { setReportJourney(journey); setReportReason(""); }}
                      className="px-3 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 font-medium rounded-lg transition text-sm"
                    >
                      🚩 Report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Contact modal */}
      {contactJourney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Contact Driver</h3>
            <p className="text-gray-700 mb-1"><span className="font-medium">Route:</span> {contactJourney.from} → {contactJourney.to}</p>
            {contactJourney.pickupAddress && <p className="text-gray-600 text-sm mb-1">Pickup: {contactJourney.pickupAddress}</p>}
            {contactJourney.dropoffAddress && <p className="text-gray-600 text-sm mb-1">Dropoff: {contactJourney.dropoffAddress}</p>}
            <p className="text-gray-700 mb-1"><span className="font-medium">Departure:</span> {formatDateTime(contactJourney.departureTime)}</p>
            <p className="text-gray-700 mb-1"><span className="font-medium">Driver:</span> {contactJourney.driverName}</p>
            <p className="text-2xl font-bold text-blue-600 my-4">{formatPhone(contactJourney.driverPhone)}</p>
            <p className="text-sm text-gray-500 mb-4">Call or text to arrange your ride and negotiate pricing.</p>
            <div className="flex gap-3">
              <a href={`tel:${contactJourney.driverPhone.replace(/\D/g, "")}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-center transition">📞 Call</a>
              <a href={whatsappLink(contactJourney.driverPhone)} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-center transition">💬 WhatsApp</a>
              <button onClick={() => setContactJourney(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportJourney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Report Journey</h3>
            <p className="text-gray-600 text-sm mb-4">{reportJourney.from} → {reportJourney.to}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            >
              <option value="">Select a reason</option>
              <option value="Spam">Spam</option>
              <option value="Fake listing">Fake listing</option>
              <option value="Inappropriate content">Inappropriate content</option>
              <option value="Wrong information">Wrong information</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleReport}
                disabled={!reportReason || reportSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
              <button onClick={() => setReportJourney(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
