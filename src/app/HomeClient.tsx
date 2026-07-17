"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db, col } from "@/lib/firebase";
import { collection, query, onSnapshot, where, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { locations } from "@/lib/constants";
import { formatDateTime, formatTimeWindow, isPast, isToday, isThisWeekend, shareText, shareRequestText, relativeTime } from "@/lib/utils";
import { Journey, RideRequest } from "@/lib/types";
import { useToast } from "@/app/ToastProvider";
import { useAuth } from "@/app/AuthProvider";
import SignInModal from "@/app/SignInModal";
import ChatModal from "@/features/chat/ChatModal";
import FeedbackButton from "@/app/FeedbackButton";
import { buildChatId } from "@/lib/chat";
import StarRating from "@/app/StarRating";

const TEST_UIDS = ["test-user-1", "test-user-2"];

type QuickFilter = "all" | "today" | "weekend" | "local";
type HomeTab = "rides" | "requests";
type SortBy = "soonest" | "seats";

function CityInput({ value, onChange, placeholder, inputClass }: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  inputClass?: string;
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
        className={inputClass ?? "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"}
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

const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
const IS_DEV = process.env.NODE_ENV === "development";

async function fetchEmulatorCode(phone: string, projectId: string): Promise<string | null> {
  try {
    const resp = await fetch(
      `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/verificationCodes`
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const codes: Array<{ phoneNumber: string; code: string }> = data.verificationCodes ?? [];
    return [...codes].reverse().find((v) => v.phoneNumber === phone)?.code ?? null;
  } catch {
    return null;
  }
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function SignInPage() {
  const { sendOTP, confirmOTP, otpSent, resetOTP, testSignIn, authLoading } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testingSignIn, setTestingSignIn] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleTestSignIn = async (userId?: string) => {
    setError("");
    setTestingSignIn(true);
    try { await testSignIn(userId); } catch (e) {
      setError(e instanceof Error ? e.message : "Test sign-in failed.");
    } finally { setTestingSignIn(false); }
  };

  const handleSend = async () => {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a valid phone number"); return; }
    setSending(true);
    try {
      await sendOTP(toE164(phone));
      if (IS_DEV) {
        const fetched = await fetchEmulatorCode(toE164(phone), process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "");
        if (fetched) setCode(fetched);
      }
    } catch (e: unknown) {
      const errCode = (e as { code?: string })?.code ?? "";
      const serverResponse = (e as { customData?: { serverResponse?: string } })?.customData?.serverResponse ?? "";
      const msg = errCode || (e instanceof Error ? e.message : String(e));
      if (msg.includes("invalid-phone-number")) setError("Invalid phone number.");
      else if (msg.includes("too-many-requests")) setError("Too many sign-in attempts on this number. Firebase has temporarily blocked it. Please wait 30–60 minutes and try again.");
      else if (msg.includes("BILLING_NOT_ENABLED") || serverResponse.includes("BILLING_NOT_ENABLED")) setError("Firebase billing not enabled.");
      else setError(msg || "Failed to send code. Please try again.");
    } finally { setSending(false); }
  };

  const handleVerify = async () => {
    setError("");
    if (code.length !== 6) { setError("Enter the 6-digit code"); return; }
    setVerifying(true);
    try { await confirmOTP(code); } catch {
      setError("Incorrect code. Please try again.");
    } finally { setVerifying(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NWA Ride Share</h1>
        <p className="text-gray-600">Carpooling across Northwest Arkansas</p>
      </div>

      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in to continue</h2>
        <p className="text-sm text-gray-500 mb-5">We&apos;ll text a 6-digit code to verify your number.</p>

        {IS_DEV && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <span className="font-semibold">Local emulator</span> — use any phone number, code auto-filled after send
          </div>
        )}

        {IS_PREVIEW ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              <span className="font-semibold">Preview env</span> — use different users to test chat between two accounts
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={() => handleTestSignIn("test-user-1")}
              disabled={testingSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-lg transition"
            >
              {testingSignIn ? "Signing in..." : "Sign in as Test User 1"}
            </button>
            <button
              onClick={() => handleTestSignIn("test-user-2")}
              disabled={testingSignIn}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2.5 rounded-lg transition"
            >
              {testingSignIn ? "Signing in..." : "Sign in as Test User 2"}
            </button>
          </div>
        ) : !otpSent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(479) 555-0123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-lg transition"
            >
              {sending ? "Sending..." : "Send Code"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Code sent to <span className="font-medium">{phone}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-lg transition"
            >
              {verifying ? "Verifying..." : "Verify & Continue"}
            </button>
            <button
              onClick={() => { setCode(""); setError(""); resetOTP(); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              ← Change phone number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeClient({ initialJourneys }: { initialJourneys: Journey[] }) {
  const toast = useToast();
  const { user, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<HomeTab>("rides");
  const [sortBy, setSortBy] = useState<SortBy>("soonest");
  const [journeys, setJourneys] = useState<Journey[]>(initialJourneys);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [loading, setLoading] = useState(initialJourneys.length === 0);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [reportJourney, setReportJourney] = useState<Journey | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [chatTarget, setChatTarget] = useState<{ listing: Journey | RideRequest; type: "journey" | "request" } | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [announcements, setAnnouncements] = useState<{ id: string; text: string }[]>([]);
  const [blockedUids, setBlockedUids] = useState<Set<string>>(new Set());
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setBlockedUids(new Set()); return; }
    user.getIdToken().then((token) =>
      fetch("/api/block/list", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: { uids: string[] }) => setBlockedUids(new Set(d.uids)))
        .catch(() => {})
    );
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, col("announcements")), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, text: d.data().text as string })));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, col("journeys")), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Journey))
        .filter((j) => !isPast(j.departureTime) && (IS_PREVIEW || !TEST_UIDS.includes(j.uid ?? "")))
        .sort((a, b) => (a.departureTime > b.departureTime ? 1 : -1));
      setJourneys(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, col("requests")), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as RideRequest))
        .filter((r) => !isPast(r.departureTime) && (IS_PREVIEW || !TEST_UIDS.includes(r.uid ?? "")))
        .sort((a, b) => (a.departureTime > b.departureTime ? 1 : -1));
      setRequests(data);
      setRequestsLoading(false);
    }, () => setRequestsLoading(false));
    return () => unsubscribe();
  }, []);

  const applyFilters = <T extends { from: string; to: string; pickupAddress?: string; dropoffAddress?: string; departureTime: string }>(items: T[]) =>
    items.filter((item) => {
      const fromText = `${item.from} ${item.pickupAddress ?? ""}`.toLowerCase();
      const toText = `${item.to} ${item.dropoffAddress ?? ""}`.toLowerCase();
      const fromMatch = fromText.includes(searchFrom.toLowerCase());
      const toMatch = toText.includes(searchTo.toLowerCase());
      const dateMatch = searchDate ? item.departureTime.startsWith(searchDate) : true;
      const quickMatch =
        quickFilter === "today" ? isToday(item.departureTime) :
        quickFilter === "weekend" ? isThisWeekend(item.departureTime) :
        quickFilter === "local" ? item.from === item.to :
        true;
      return fromMatch && toMatch && dateMatch && quickMatch;
    });

  const sort = <T extends { departureTime: string; availableSeats?: number; seatsNeeded?: number }>(items: T[]) =>
    [...items].sort((a, b) => {
      if (sortBy === "seats") {
        const aSeats = a.availableSeats ?? a.seatsNeeded ?? 0;
        const bSeats = b.availableSeats ?? b.seatsNeeded ?? 0;
        return bSeats - aSeats;
      }
      return a.departureTime > b.departureTime ? 1 : -1;
    });

  const filteredJourneys = sort(applyFilters(journeys)).filter((j) => !blockedUids.has(j.uid ?? ""));
  const filteredRequests = sort(applyFilters(requests)).filter((r) => !blockedUids.has(r.uid ?? ""));

  const hasFilters = searchFrom || searchTo || searchDate || quickFilter !== "all";

  const handleShare = async (journey: Journey) => {
    const url = `${window.location.origin}/journey/${journey.id}`;
    const text = shareText(journey, url);
    if (navigator.share) {
      await navigator.share({ title: `${journey.from} → ${journey.to}`, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(journey.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleShareRequest = async (req: RideRequest) => {
    const url = `${window.location.origin}/request/${req.id}`;
    const text = shareRequestText(req, url);
    if (navigator.share) {
      await navigator.share({ title: `Ride Needed: ${req.from} → ${req.to}`, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(req.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleWatch = async (journey: Journey) => {
    if (!user) { setShowSignIn(true); return; }
    const token = await user.getIdToken();
    const res = await fetch("/api/watch", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ journeyId: journey.id, route: `${journey.from} → ${journey.to}` }),
    });
    const data = await res.json() as { watching: boolean };
    setWatchedIds((prev) => {
      const next = new Set(prev);
      data.watching ? next.add(journey.id) : next.delete(journey.id);
      return next;
    });
    toast(data.watching ? "🔔 You'll be notified if this ride changes." : "Watch removed.");
  };

  const handleDeleteJourney = async (journeyId: string) => {
    if (!user) { toast("You must be signed in to delete.", "error"); return; }
    if (!confirm("Permanently delete this journey? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, col("journeys"), journeyId));
      toast("Journey deleted.");
    } catch (err) {
      console.error("Delete journey failed:", err);
      toast("Failed to delete. Please try again.", "error");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user) { toast("You must be signed in to delete.", "error"); return; }
    if (!confirm("Permanently delete this request? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, col("requests"), requestId));
      toast("Request deleted.");
    } catch (err) {
      console.error("Delete request failed:", err);
      toast("Failed to delete. Please try again.", "error");
    }
  };

  const handleReport = async () => {
    if (!reportJourney || !reportReason) return;
    setReportSubmitting(true);
    try {
      await addDoc(collection(db, col("reports")), {
        journeyId: reportJourney.id,
        reason: reportReason,
        createdAt: serverTimestamp(),
      });
      setReportJourney(null);
      setReportReason("");
      toast("Report submitted. Thank you.");
    } catch {
      toast("Failed to submit report. Please try again.", "error");
    } finally {
      setReportSubmitting(false);
    }
  };

  if (authLoading || !user) return <SignInPage />;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── ANNOUNCEMENTS ── */}
      {announcements.filter((a) => !dismissedAnnouncements.has(a.id)).map((a) => (
        <div key={a.id} className="bg-blue-600 text-white text-xs text-center px-4 py-2 font-medium flex items-start justify-between gap-2">
          <span className="flex-1">📢 {a.text}</span>
          <button onClick={() => setDismissedAnnouncements((p) => new Set([...p, a.id]))} className="shrink-0 opacity-70 hover:opacity-100 text-lg leading-none mt-0.5">×</button>
        </div>
      ))}

      {/* ── SEARCH BAR ── */}
      <div className="bg-white border-b border-gray-100 px-3 py-2.5 sticky top-14 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {/* From pill */}
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-2">
              <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              <CityInput value={searchFrom} onChange={setSearchFrom} placeholder="From" inputClass="bg-transparent text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none font-medium" />
            </div>
          </div>
          {/* Arrow */}
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {/* To pill */}
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-2">
              <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <CityInput value={searchTo} onChange={setSearchTo} placeholder="To" inputClass="bg-transparent text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none font-medium" />
            </div>
          </div>
          {/* Date button */}
          <div className="relative shrink-0">
            <label className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 cursor-pointer transition">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span className="text-xs text-gray-600 font-medium">{searchDate ? new Date(searchDate + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Date"}</span>
              <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
            </label>
            {searchDate && (
              <button onClick={() => setSearchDate("")} className="absolute -top-1 -right-1 bg-gray-400 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold">×</button>
            )}
          </div>
        </div>

        {/* Quick filter chips */}
        <div className="max-w-4xl mx-auto flex gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-0.5">
          {(["all", "today", "weekend", "local"] as QuickFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setQuickFilter(f)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                quickFilter === f
                  ? f === "local" ? "bg-green-600 text-white" : "bg-blue-600 text-white"
                  : f === "local" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f === "today" ? "Today" : f === "weekend" ? "Weekend" : "📍 Local"}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTINGS SECTION ── */}
      <div className="max-w-4xl mx-auto px-3 pt-3 pb-10">

        {/* Tab bar + sort */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("rides")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "rides" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              }`}
            >
              🚗 Rides {!loading && <span className="text-xs font-normal opacity-70">({filteredJourneys.length})</span>}
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "requests" ? "bg-white text-violet-600 shadow-sm" : "text-gray-500"
              }`}
            >
              🙋 Requests {!requestsLoading && <span className="text-xs font-normal opacity-70">({filteredRequests.length})</span>}
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none"
          >
            <option value="soonest">Soonest</option>
            <option value="seats">Most seats</option>
          </select>
        </div>

        {/* Cards */}
        {activeTab === "rides" ? (
          <div className="space-y-3">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : filteredJourneys.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-14 px-4">
                <p className="text-4xl mb-3">🚗</p>
                <p className="text-gray-800 font-semibold mb-1">
                  {journeys.length === 0 ? "No journeys posted yet" : "No rides match your search"}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Offering a ride?{" "}
                  <Link href="/driver" className="text-blue-600 hover:underline font-semibold">Post a journey</Link>
                </p>
                {hasFilters && (
                  <button
                    onClick={() => { setSearchFrom(""); setSearchTo(""); setSearchDate(""); setQuickFilter("all"); }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              filteredJourneys.map((journey) => (
                <div key={journey.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-all hover:shadow-md">
                  <div className="p-4">
                    {/* Route — biggest element */}
                    <Link href={`/journey/${journey.id}`} className="block mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-gray-900 leading-tight">
                          {journey.from === journey.to ? journey.from : journey.from}
                        </span>
                        {journey.from !== journey.to && (
                          <>
                            <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-base font-extrabold text-gray-900 leading-tight">{journey.to}</span>
                          </>
                        )}
                        {journey.from === journey.to && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LOCAL</span>}
                        {journey.roundTrip && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">↔ Return</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          {journey.bufferHours ? formatTimeWindow(journey.departureTime, journey.bufferHours) : formatDateTime(journey.departureTime)}
                        </span>
                        {relativeTime(journey.departureTime) && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{relativeTime(journey.departureTime)}</span>
                        )}
                        {journey.pickupAddress && <span className="text-xs text-gray-400 truncate max-w-[140px]">📍 {journey.pickupAddress}</span>}
                      </div>
                    </Link>

                    {/* Driver row + seats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-base shrink-0">👤</div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-gray-800 block truncate">{journey.driverName}</span>
                          {journey.uid && <StarRating uid={journey.uid} />}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          {Array.from({ length: Math.min(journey.availableSeats, 6) }).map((_, i) => (
                            <div key={i} className="w-2 h-4 bg-blue-500 rounded-sm" />
                          ))}
                          {Array.from({ length: Math.max(0, 6 - journey.availableSeats) }).map((_, i) => (
                            <div key={i} className="w-2 h-4 bg-gray-200 rounded-sm" />
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{journey.availableSeats} seat{journey.availableSeats !== 1 ? "s" : ""}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      {journey.uid && journey.uid !== user?.uid && (
                        <button
                          onClick={() => {
                            if (!user) { setShowSignIn(true); setChatTarget({ listing: journey, type: "journey" }); }
                            else setChatTarget({ listing: journey, type: "journey" });
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
                        >
                          💬 Chat
                        </button>
                      )}
                      <button onClick={() => handleShare(journey)} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition text-sm font-medium">
                        {copiedId === journey.id ? "✓" : "Share"}
                      </button>
                      {user && ((journey.uid && journey.uid === user.uid) || (journey.driverPhone && journey.driverPhone === user.phoneNumber)) ? (
                        <button onClick={() => handleDeleteJourney(journey.id)} className="px-3 py-2.5 text-red-400 hover:bg-red-50 rounded-xl transition text-sm border border-red-100">
                          Delete
                        </button>
                      ) : (
                        <button onClick={() => { setReportJourney(journey); setReportReason(""); }} className="px-3 py-2.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition text-sm">
                          ⚑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {requestsLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-14 px-4">
                <p className="text-4xl mb-3">🙋</p>
                <p className="text-gray-800 font-semibold mb-1">
                  {requests.length === 0 ? "No ride requests yet" : "No requests match your search"}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Need a ride?{" "}
                  <Link href="/passenger" className="text-violet-600 hover:underline font-semibold">Post a request</Link>
                </p>
                {hasFilters && (
                  <button onClick={() => { setSearchFrom(""); setSearchTo(""); setSearchDate(""); setQuickFilter("all"); }} className="text-sm text-blue-600 hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-all hover:shadow-md">
                  <div className="p-4">
                    {/* Route */}
                    <Link href={`/request/${req.id}`} className="block mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-gray-900 leading-tight">
                          {req.from === req.to ? req.from : req.from}
                        </span>
                        {req.from !== req.to && (
                          <>
                            <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-base font-extrabold text-gray-900 leading-tight">{req.to}</span>
                          </>
                        )}
                        {req.from === req.to && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LOCAL</span>}
                        {req.roundTrip && <span className="text-[10px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">↔ Return</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          {req.bufferHours ? formatTimeWindow(req.departureTime, req.bufferHours) : formatDateTime(req.departureTime)}
                        </span>
                        {relativeTime(req.departureTime) && (
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{relativeTime(req.departureTime)}</span>
                        )}
                        {req.pickupAddress && <span className="text-xs text-gray-400 truncate max-w-[140px]">📍 {req.pickupAddress}</span>}
                      </div>
                    </Link>

                    {/* Passenger row + seats needed */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-base shrink-0">🙋</div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-gray-800 block truncate">{req.passengerName}</span>
                          {req.uid && <StarRating uid={req.uid} />}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          {Array.from({ length: Math.min(req.seatsNeeded, 6) }).map((_, i) => (
                            <div key={i} className="w-2 h-4 bg-violet-500 rounded-sm" />
                          ))}
                          {Array.from({ length: Math.max(0, 6 - req.seatsNeeded) }).map((_, i) => (
                            <div key={i} className="w-2 h-4 bg-gray-200 rounded-sm" />
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{req.seatsNeeded} needed</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      {req.uid && req.uid !== user?.uid && (
                        <button
                          onClick={() => {
                            if (!user) { setShowSignIn(true); setChatTarget({ listing: req, type: "request" }); }
                            else setChatTarget({ listing: req, type: "request" });
                          }}
                          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
                        >
                          💬 Chat
                        </button>
                      )}
                      <button onClick={() => handleShareRequest(req)} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition text-sm font-medium">
                        {copiedId === req.id ? "✓" : "Share"}
                      </button>
                      {user && ((req.uid && req.uid === user.uid) || (req.passengerPhone && req.passengerPhone === user.phoneNumber)) && (
                        <button onClick={() => handleDeleteRequest(req.id)} className="px-3 py-2.5 text-red-400 hover:bg-red-50 rounded-xl transition text-sm border border-red-100">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sign-in gate */}
      {showSignIn && (
        <SignInModal
          onClose={() => { setShowSignIn(false); setChatTarget(null); }}
          onSuccess={() => setShowSignIn(false)}
          title="Sign in to chat"
        />
      )}

      {/* Chat modal */}
      {chatTarget && user && (() => {
        const { listing, type } = chatTarget;
        const ownerUid = listing.uid!;
        const ownerName = type === "journey"
          ? (listing as Journey).driverName
          : (listing as RideRequest).passengerName;
        const route = `${listing.from} → ${listing.to}`;
        const chatId = buildChatId(type, listing.id, user.uid, ownerUid);
        return (
          <ChatModal
            chatId={chatId}
            ownerUid={ownerUid}
            ownerName={ownerName}
            route={route}
            listingType={type}
            listingId={listing.id}
            onClose={() => setChatTarget(null)}
          />
        );
      })()}

      {/* Report modal */}
      {reportJourney && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Report Journey</h3>
            <p className="text-gray-500 text-sm mb-4">{reportJourney.from} → {reportJourney.to}</p>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4 text-sm"
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
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:text-red-400 text-white font-bold py-2.5 rounded-xl transition text-sm"
              >
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
              <button onClick={() => setReportJourney(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <FeedbackButton />

      {/* FAB — mobile post button */}
      <div className="sm:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2">
        <Link
          href="/driver"
          className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-3 rounded-2xl shadow-lg active:scale-95 transition-transform text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Offer a ride
        </Link>
        <Link
          href="/passenger"
          className="flex items-center gap-2 bg-violet-600 text-white font-bold px-4 py-3 rounded-2xl shadow-lg active:scale-95 transition-transform text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Need a ride
        </Link>
      </div>
    </div>
  );
}
