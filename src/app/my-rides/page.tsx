"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, col } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { formatDateTime, minDepartureTime } from "@/lib/utils";
import DateTimePicker from "@/app/DateTimePicker";
import { Journey, RideRequest } from "@/lib/types";
import { useToast } from "@/app/ToastProvider";
import { useAuth } from "@/app/AuthProvider";
import SignInModal from "@/app/SignInModal";
import CancelModal from "@/app/CancelModal";
import RateSomeoneModal from "@/app/RateSomeoneModal";

type Tab = "journeys" | "requests" | "profile";

type JourneyEdit = { departureTime: string; returnTime: string; availableSeats: number };
type RequestEdit = { departureTime: string; returnTime: string; seatsNeeded: number };

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function MyRidesPage() {
  const toast = useToast();
  const { user, authLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [tab, setTab] = useState<Tab>("journeys");

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loadingJ, setLoadingJ] = useState(true);
  const [loadingR, setLoadingR] = useState(true);

  const [cancelTarget, setCancelTarget] = useState<{ id: string; type: "journey" | "request" } | null>(null);
  const [rateListingId, setRateListingId] = useState<string | null>(null);

  // Profile tab state
  const [socialUrl, setSocialUrl] = useState("");
  const [profileStats, setProfileStats] = useState({ completedCount: 0, cancelCount: 0 });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [journeyEdit, setJourneyEdit] = useState<JourneyEdit>({ departureTime: "", returnTime: "", availableSeats: 1 });

  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [requestEdit, setRequestEdit] = useState<RequestEdit>({ departureTime: "", returnTime: "", seatsNeeded: 1 });

  useEffect(() => {
    if (!user) { setLoadingJ(false); setLoadingR(false); return; }

    const unsubJ = onSnapshot(
      query(collection(db, col("journeys")), where("uid", "==", user.uid)),
      (snap) => {
        setJourneys(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Journey))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((a, b) => ((b as any).createdAt?.seconds ?? 0) - ((a as any).createdAt?.seconds ?? 0))
        );
        setLoadingJ(false);
      },
      () => setLoadingJ(false)
    );

    const unsubR = onSnapshot(
      query(collection(db, col("requests")), where("uid", "==", user.uid)),
      (snap) => {
        setRequests(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as RideRequest))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((a, b) => ((b as any).createdAt?.seconds ?? 0) - ((a as any).createdAt?.seconds ?? 0))
        );
        setLoadingR(false);
      },
      () => setLoadingR(false)
    );

    return () => { unsubJ(); unsubR(); };
  }, [user]);

  const startEditJourney = (j: Journey) => {
    setEditingJourneyId(j.id);
    setJourneyEdit({
      departureTime: j.departureTime,
      returnTime: j.returnTime ?? "",
      availableSeats: j.availableSeats,
    });
  };

  const saveJourney = async (id: string) => {
    if (!journeyEdit.departureTime) return;
    try {
      await updateDoc(doc(db, col("journeys"), id), {
        departureTime: journeyEdit.departureTime,
        returnTime: journeyEdit.returnTime || null,
        availableSeats: journeyEdit.availableSeats,
      });
      setEditingJourneyId(null);
      toast("Journey updated.");
    } catch {
      toast("Failed to update. Please try again.", "error");
    }
  };

  const completeJourney = async (id: string) => {
    if (!confirm("Mark this journey as completed?")) return;
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, listingType: "journey" }),
      });
      if (!res.ok) throw new Error();
      toast("Journey marked as completed.");
      setRateListingId(id);
    } catch {
      toast("Failed to update. Please try again.", "error");
    }
  };

  const cancelJourney = async (id: string, reason: string) => {
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, listingType: "journey", reason }),
      });
      if (!res.ok) throw new Error();
      toast("Journey cancelled.");
      const j = journeys.find((x) => x.id === id);
      if (j) {
        fetch("/api/watch/notify", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ journeyId: id, route: `${j.from} → ${j.to}`, message: "This ride was cancelled." }),
        }).catch(() => {});
      }
    } catch {
      toast("Failed to cancel.", "error");
    } finally {
      setCancelTarget(null);
    }
  };

  const deleteJourney = async (id: string) => {
    if (!confirm("Permanently delete this journey? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, col("journeys"), id));
      toast("Journey deleted.");
    } catch {
      toast("Failed to delete.", "error");
    }
  };

  const startEditRequest = (r: RideRequest) => {
    setEditingRequestId(r.id);
    setRequestEdit({
      departureTime: r.departureTime,
      returnTime: r.returnTime ?? "",
      seatsNeeded: r.seatsNeeded,
    });
  };

  const saveRequest = async (id: string) => {
    if (!requestEdit.departureTime) return;
    try {
      await updateDoc(doc(db, col("requests"), id), {
        departureTime: requestEdit.departureTime,
        returnTime: requestEdit.returnTime || null,
        seatsNeeded: requestEdit.seatsNeeded,
      });
      setEditingRequestId(null);
      toast("Request updated.");
    } catch {
      toast("Failed to update. Please try again.", "error");
    }
  };

  const completeRequest = async (id: string) => {
    if (!confirm("Mark this request as completed?")) return;
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, listingType: "request" }),
      });
      if (!res.ok) throw new Error();
      toast("Request marked as completed.");
      setRateListingId(id);
    } catch {
      toast("Failed to update. Please try again.", "error");
    }
  };

  const cancelRequest = async (id: string, reason: string) => {
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, listingType: "request", reason }),
      });
      if (!res.ok) throw new Error();
      toast("Request cancelled.");
    } catch {
      toast("Failed to cancel.", "error");
    } finally {
      setCancelTarget(null);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Permanently delete this request? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, col("requests"), id));
      toast("Request deleted.");
    } catch {
      toast("Failed to delete.", "error");
    }
  };

  const loadProfile = async () => {
    if (!user || profileLoaded) return;
    setProfileLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      setSocialUrl(data.socialUrl ?? "");
      setProfileStats({ completedCount: data.completedCount ?? 0, cancelCount: data.cancelCount ?? 0 });
      setProfileLoaded(true);
    } catch { /* ignore */ }
    finally { setProfileLoading(false); }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ socialUrl }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? "Failed to save.", "error"); return; }
      toast("Profile saved.");
    } catch {
      toast("Failed to save.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🗂️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your rides</h2>
          <p className="text-gray-500 text-sm mb-6">See and manage all your posted journeys and ride requests.</p>
          <button
            onClick={() => setShowSignIn(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            Sign in with Phone
          </button>
        </div>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} title="Sign in with Phone" />}
      </div>
    );
  }

  const loading = loadingJ || loadingR;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      {rateListingId && (
        <RateSomeoneModal
          listingId={rateListingId}
          onClose={() => setRateListingId(null)}
        />
      )}
      {cancelTarget && (
        <CancelModal
          listingType={cancelTarget.type}
          onConfirm={(reason) =>
            cancelTarget.type === "journey"
              ? cancelJourney(cancelTarget.id, reason)
              : cancelRequest(cancelTarget.id, reason)
          }
          onClose={() => setCancelTarget(null)}
        />
      )}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-orange-200">🧳</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">My Trips</h1>
              <p className="text-xs text-orange-600 font-semibold">Your rides & profile</p>
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {user.phoneNumber ? `●●●● ${user.phoneNumber.slice(-4)}` : ""}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setTab("journeys")}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition ${
              tab === "journeys" ? "bg-white shadow text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Journeys {!loadingJ && <span className="ml-1 text-xs font-normal">({journeys.length})</span>}
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition ${
              tab === "requests" ? "bg-white shadow text-purple-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Requests {!loadingR && <span className="ml-1 text-xs font-normal">({requests.length})</span>}
          </button>
          <button
            onClick={() => { setTab("profile"); loadProfile(); }}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition ${
              tab === "profile" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Profile
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "journeys" ? (
          <div className="space-y-4">
            {journeys.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
                <p className="text-lg mb-1">No journeys posted yet</p>
                <Link href="/driver" className="text-blue-600 hover:underline text-sm font-medium">Post a journey →</Link>
              </div>
            ) : (
              journeys.map((j) => (
                <div key={j.id} className="bg-white rounded-lg shadow p-5">
                  {editingJourneyId === j.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{j.from} → {j.to}</span>
                        {j.roundTrip && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">↔ Round trip</span>}
                        {j.recurring === "weekly" && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">↻ Weekly</span>}
                        {j.recurring === "weekdays" && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">↻ Weekdays</span>}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Departure Date & Time</label>
                          <DateTimePicker
                            value={journeyEdit.departureTime}
                            onChange={(v) => setJourneyEdit({ ...journeyEdit, departureTime: v })}
                            minDate={minDepartureTime().substring(0, 10)}
                            inputClass={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Available Seats</label>
                          <select
                            value={journeyEdit.availableSeats}
                            onChange={(e) => setJourneyEdit({ ...journeyEdit, availableSeats: Number(e.target.value) })}
                            className={inputClass}
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {j.roundTrip && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Return Date & Time</label>
                          <DateTimePicker
                            value={journeyEdit.returnTime}
                            onChange={(v) => setJourneyEdit({ ...journeyEdit, returnTime: v })}
                            minDate={journeyEdit.departureTime.substring(0, 10) || minDepartureTime().substring(0, 10)}
                            inputClass={inputClass}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveJourney(j.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition"
                        >
                          Save changes
                        </button>
                        <button
                          onClick={() => setEditingJourneyId(null)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 px-4 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900 text-lg">{j.from} → {j.to}</p>
                          {j.roundTrip && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">↔ Round trip</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            j.status === "active" ? "bg-green-100 text-green-800"
                            : j.status === "completed" ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                          }`}>
                            {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
                          </span>
                        </div>
                        {j.pickupAddress && <p className="text-xs text-gray-500">From: {j.pickupAddress}</p>}
                        {j.dropoffAddress && <p className="text-xs text-gray-500">To: {j.dropoffAddress}</p>}
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Departs:</span> {formatDateTime(j.departureTime)}
                        </p>
                        {j.roundTrip && j.returnTime && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Returns:</span> {formatDateTime(j.returnTime)}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">{j.availableSeats} seat{j.availableSeats !== 1 ? "s" : ""} available</p>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                        {j.status === "active" && (() => {
                          const isPast = new Date(j.departureTime) < new Date();
                          return (
                            <>
                              {isPast ? (
                                <button
                                  onClick={() => completeJourney(j.id)}
                                  className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition"
                                >
                                  Mark Completed
                                </button>
                              ) : (
                                <button
                                  onClick={() => startEditJourney(j)}
                                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg transition"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => setCancelTarget({ id: j.id, type: "journey" })}
                                className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-4 rounded-lg transition"
                              >
                                {isPast ? "Did Not Happen" : "Cancel"}
                              </button>
                            </>
                          );
                        })()}
                        {j.status === "completed" && (
                          <button
                            onClick={() => setRateListingId(j.id)}
                            className="text-sm border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold py-2.5 px-4 rounded-lg transition"
                          >
                            ⭐ Rate
                          </button>
                        )}
                        <button
                          onClick={() => deleteJourney(j.id)}
                          className="text-sm border border-red-300 text-red-600 hover:bg-red-50 font-bold py-2.5 px-4 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
                <p className="text-lg mb-1">No ride requests yet</p>
                <Link href="/passenger" className="text-purple-600 hover:underline text-sm font-medium">Request a ride →</Link>
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow p-5">
                  {editingRequestId === r.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{r.from} → {r.to}</span>
                        {r.roundTrip && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">↔ Round trip</span>}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Travel Date & Time</label>
                          <DateTimePicker
                            value={requestEdit.departureTime}
                            onChange={(v) => setRequestEdit({ ...requestEdit, departureTime: v })}
                            minDate={minDepartureTime().substring(0, 10)}
                            inputClass={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Seats Needed</label>
                          <select
                            value={requestEdit.seatsNeeded}
                            onChange={(e) => setRequestEdit({ ...requestEdit, seatsNeeded: Number(e.target.value) })}
                            className={inputClass}
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {r.roundTrip && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Return Date & Time</label>
                          <DateTimePicker
                            value={requestEdit.returnTime}
                            onChange={(v) => setRequestEdit({ ...requestEdit, returnTime: v })}
                            minDate={requestEdit.departureTime.substring(0, 10) || minDepartureTime().substring(0, 10)}
                            inputClass={inputClass}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveRequest(r.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition"
                        >
                          Save changes
                        </button>
                        <button
                          onClick={() => setEditingRequestId(null)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 px-4 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900 text-lg">{r.from} → {r.to}</p>
                          {r.roundTrip && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">↔ Round trip</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            r.status === "active" ? "bg-green-100 text-green-800"
                            : r.status === "completed" ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                          }`}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </div>
                        {r.pickupAddress && <p className="text-xs text-gray-500">From: {r.pickupAddress}</p>}
                        {r.dropoffAddress && <p className="text-xs text-gray-500">To: {r.dropoffAddress}</p>}
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Departs:</span> {formatDateTime(r.departureTime)}
                        </p>
                        {r.roundTrip && r.returnTime && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Returns:</span> {formatDateTime(r.returnTime)}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">{r.seatsNeeded} seat{r.seatsNeeded !== 1 ? "s" : ""} needed</p>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                        {r.status === "active" && (() => {
                          const isPast = new Date(r.departureTime) < new Date();
                          return (
                            <>
                              {isPast ? (
                                <button
                                  onClick={() => completeRequest(r.id)}
                                  className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition"
                                >
                                  Mark Completed
                                </button>
                              ) : (
                                <button
                                  onClick={() => startEditRequest(r)}
                                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-4 rounded-lg transition"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => setCancelTarget({ id: r.id, type: "request" })}
                                className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-4 rounded-lg transition"
                              >
                                {isPast ? "Did Not Happen" : "Cancel"}
                              </button>
                            </>
                          );
                        })()}
                        {r.status === "completed" && (
                          <button
                            onClick={() => setRateListingId(r.id)}
                            className="text-sm border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-bold py-2.5 px-4 rounded-lg transition"
                          >
                            ⭐ Rate
                          </button>
                        )}
                        <button
                          onClick={() => deleteRequest(r.id)}
                          className="text-sm border border-red-300 text-red-600 hover:bg-red-50 font-bold py-2.5 px-4 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === "profile" && (
          profileLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{profileStats.completedCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Rides completed</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className={`text-3xl font-bold ${profileStats.cancelCount >= 3 ? "text-orange-500" : "text-gray-900"}`}>{profileStats.cancelCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cancellations</p>
                </div>
              </div>

              {/* Social link */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  Social profile link <span className="text-gray-400 font-normal">(optional)</span>
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Add a public Facebook, LinkedIn, Instagram, or X profile so riders can verify who you are. This will show as a link on your listings.
                </p>
                <input
                  type="url"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  placeholder="https://facebook.com/yourname"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                {socialUrl && (
                  <a href={socialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mb-3">
                    Preview link →
                  </a>
                )}
                <div className="flex gap-3">
                  {socialUrl && (
                    <button
                      onClick={() => setSocialUrl("")}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg transition"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition text-sm"
                  >
                    {savingProfile ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Your phone number is never shown publicly. Only your name, ride history, and optional social link are visible to others.
              </p>
            </div>
          )
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
