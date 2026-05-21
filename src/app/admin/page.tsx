"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/AuthProvider";
import { formatDateTime } from "@/lib/utils";

type Tab = "dashboard" | "listings" | "reports" | "chats" | "users" | "announcements";

// ─── helpers ────────────────────────────────────────────────────────────────

async function adminFetch(user: { getIdToken: () => Promise<string> }, path: string, opts: RequestInit = {}) {
  const token = await user.getIdToken();
  return fetch(path, { ...opts, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers ?? {}) } });
}

// ─── types ───────────────────────────────────────────────────────────────────

type Stats = { activeJourneys: number; activeRequests: number; totalChats: number; pendingReports: number };
type Listing = { id: string; type: "journey" | "request"; uid?: string; driverName?: string; passengerName?: string; driverPhone?: string; passengerPhone?: string; from: string; to: string; departureTime: string; status: string };
type Report = { id: string; journeyId: string; reason: string; resolved?: boolean; listing?: Listing | null };
type AdminChat = { id: string; participants: string[]; participantNames: Record<string, string>; route: string; lastMessage: string; updatedAt: string | null; listingType: string };
type AdminUser = { uid: string; phone: string; name: string; journeys: number; requests: number; blocked: boolean };
type Announcement = { id: string; text: string; createdAt: string | null };
type ChatMessage = { id: string; uid: string; senderName: string; text: string; createdAt: string | null };

// ─── tab components ──────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function Dashboard({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch(user, "/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Spinner />;
  if (!stats) return <p className="text-red-500">Failed to load stats.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Journeys" value={stats.activeJourneys} color="border-blue-500" />
        <StatCard label="Active Requests" value={stats.activeRequests} color="border-green-500" />
        <StatCard label="Total Chats" value={stats.totalChats} color="border-purple-500" />
        <StatCard label="Pending Reports" value={stats.pendingReports} color="border-red-500" />
      </div>
      <p className="text-sm text-gray-400">Stats refresh each time you open this tab.</p>
    </div>
  );
}

function Listings({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [journeys, setJourneys] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "journey" | "request">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch(user, "/api/admin/listings");
    const data = await r.json();
    setJourneys(data.journeys ?? []);
    setRequests(data.requests ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (collection: string, id: string) => {
    if (!confirm("Delete this listing permanently?")) return;
    setDeleting(id);
    await adminFetch(user, "/api/admin/listings", {
      method: "DELETE",
      body: JSON.stringify({ collection, id }),
    });
    await load();
    setDeleting(null);
  };

  const all: Listing[] = [...journeys, ...requests].sort((a, b) => b.departureTime.localeCompare(a.departureTime));
  const visible = all.filter((l) => {
    if (filter !== "all" && l.type !== filter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "journey", "request"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {f === "all" ? "All types" : f === "journey" ? "🚗 Journeys" : "🙋 Requests"}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1 self-stretch" />
        {(["all", "active", "cancelled"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1 rounded-full text-sm font-medium transition ${statusFilter === f ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {f === "all" ? "All status" : f}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{visible.length} listing{visible.length !== 1 ? "s" : ""}</p>
          {visible.map((l) => {
            const name = l.type === "journey" ? l.driverName : l.passengerName;
            const phone = l.type === "journey" ? l.driverPhone : l.passengerPhone;
            const collection = l.type === "journey" ? "journeys" : "requests";
            return (
              <div key={l.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-3">
                <span className="text-xl shrink-0">{l.type === "journey" ? "🚗" : "🙋"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{l.from} → {l.to}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{l.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">{name} · {phone}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(l.departureTime)}</p>
                </div>
                <button
                  onClick={() => handleDelete(collection, l.id)}
                  disabled={deleting === l.id}
                  className="shrink-0 text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition disabled:opacity-50"
                >
                  {deleting === l.id ? "…" : "Delete"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Reports({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch(user, "/api/admin/reports");
    const data = await r.json();
    setReports(data.reports ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id: string, deleteListing?: { collection: string; docId: string }) => {
    setWorking(id);
    await adminFetch(user, "/api/admin/reports", {
      method: "PATCH",
      body: JSON.stringify({ id, deleteListing }),
    });
    await load();
    setWorking(null);
  };

  if (loading) return <Spinner />;

  const pending = reports.filter((r) => !r.resolved);
  const resolved = reports.filter((r) => r.resolved);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{pending.length} pending · {resolved.length} resolved</p>
      {pending.length === 0 && <p className="text-gray-400 text-sm">No pending reports.</p>}
      {pending.map((r) => (
        <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-400 space-y-2">
          <p className="font-semibold text-gray-900">Report: <span className="font-normal text-gray-700">{r.reason}</span></p>
          {r.listing ? (
            <p className="text-sm text-gray-600">{r.listing.from} → {r.listing.to} ({r.listing.type})</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Listing already deleted</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => resolve(r.id)}
              disabled={working === r.id}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition"
            >
              Mark Resolved
            </button>
            {r.listing && (
              <button
                onClick={() => resolve(r.id, { collection: r.listing!.type === "journey" ? "journeys" : "requests", docId: r.listing!.id })}
                disabled={working === r.id}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
              >
                Delete Listing & Resolve
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chats({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState<AdminChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    adminFetch(user, "/api/admin/chats")
      .then((r) => r.json())
      .then((d) => setChats(d.chats ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  const viewChat = async (chat: AdminChat) => {
    setOpenChat(chat);
    setMsgLoading(true);
    const r = await adminFetch(user, `/api/admin/chats/${chat.id}`);
    const data = await r.json();
    setMessages(data.messages ?? []);
    setMsgLoading(false);
  };

  if (loading) return <Spinner />;

  if (openChat) {
    return (
      <div className="space-y-3">
        <button onClick={() => setOpenChat(null)} className="text-sm text-blue-600 hover:underline">← Back to all chats</button>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-gray-900">{openChat.route}</p>
          <p className="text-xs text-gray-500">
            {Object.values(openChat.participantNames).join(" ↔ ")}
          </p>
        </div>
        {msgLoading ? <Spinner /> : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {messages.length === 0 && <p className="text-gray-400 text-sm">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m.id} className="bg-white rounded-xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{m.senderName}</span>
                  <span className="text-xs text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</span>
                </div>
                <p className="text-sm text-gray-900">{m.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">{chats.length} conversation{chats.length !== 1 ? "s" : ""}</p>
      {chats.map((c) => (
        <button
          key={c.id}
          onClick={() => viewChat(c)}
          className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-left flex gap-3 items-start"
        >
          <span className="text-xl shrink-0">{c.listingType === "journey" ? "🚗" : "🙋"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{c.route}</p>
            <p className="text-xs text-gray-500 truncate">{Object.values(c.participantNames).join(" ↔ ")}</p>
            {c.lastMessage && <p className="text-sm text-gray-600 truncate mt-0.5">{c.lastMessage}</p>}
          </div>
          <span className="text-xs text-gray-400 shrink-0">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ""}</span>
        </button>
      ))}
    </div>
  );
}

function Users({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch(user, "/api/admin/users");
    const data = await r.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (u: AdminUser) => {
    const action = u.blocked ? "unblock" : "block";
    if (!confirm(`${action === "block" ? "Block" : "Unblock"} ${u.phone}? ${action === "block" ? "They won't be able to post." : ""}`)) return;
    setWorking(u.uid);
    await adminFetch(user, "/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ phone: u.phone, action }),
    });
    await load();
    setWorking(null);
  };

  if (loading) return <Spinner />;

  const sorted = [...users].sort((a, b) => (b.journeys + b.requests) - (a.journeys + a.requests));

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? "s" : ""} · {users.filter((u) => u.blocked).length} blocked</p>
      {sorted.map((u) => (
        <div key={u.uid} className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${u.blocked ? "opacity-60 border border-red-200" : ""}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{u.name}</p>
              {u.blocked && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Blocked</span>}
            </div>
            <p className="text-sm text-gray-500">{u.phone}</p>
            <p className="text-xs text-gray-400">{u.journeys} journey{u.journeys !== 1 ? "s" : ""} · {u.requests} request{u.requests !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => toggleBlock(u)}
            disabled={working === u.uid}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition ${u.blocked ? "bg-green-100 hover:bg-green-200 text-green-700" : "bg-red-100 hover:bg-red-200 text-red-700"}`}
          >
            {working === u.uid ? "…" : u.blocked ? "Unblock" : "Block"}
          </button>
        </div>
      ))}
    </div>
  );
}

function Announcements({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch(user, "/api/admin/announcements");
    const data = await r.json();
    setAnnouncements(data.announcements ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    await adminFetch(user, "/api/admin/announcements", { method: "POST", body: JSON.stringify({ text }) });
    setText("");
    await load();
    setPosting(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    await adminFetch(user, "/api/admin/announcements", { method: "DELETE", body: JSON.stringify({ id }) });
    await load();
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-gray-700">Post new announcement</p>
        <p className="text-xs text-gray-400">Appears as a banner on the home page for all users.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Welcome to NWA Ride Share! Always verify the driver before getting in."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={post}
          disabled={!text.trim() || posting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
        >
          {posting ? "Posting…" : "Post Announcement"}
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{announcements.length} active announcement{announcements.length !== 1 ? "s" : ""}</p>
          {announcements.length === 0 && <p className="text-gray-400 text-sm">No announcements.</p>}
          {announcements.map((a) => (
            <div key={a.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-blue-900">{a.text}</p>
                <p className="text-xs text-blue-400 mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</p>
              </div>
              <button
                onClick={() => remove(a.id)}
                disabled={deleting === a.id}
                className="shrink-0 text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
              >
                {deleting === a.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    user.getIdToken().then((token) =>
      fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
    ).then((r) => setIsAdmin(r.ok))
    .catch(() => setIsAdmin(false));
  }, [user]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "listings", label: "Listings" },
    { id: "reports", label: "Reports" },
    { id: "chats", label: "Chats" },
    { id: "users", label: "Users" },
    { id: "announcements", label: "Announcements" },
  ];

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Access Denied</p>
          <p className="text-gray-500">This page is restricted to admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl">⚙️</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-xs text-gray-500">NWA Ride Share</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-max px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${tab === t.id ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "dashboard" && <Dashboard user={user} />}
        {tab === "listings" && <Listings user={user} />}
        {tab === "reports" && <Reports user={user} />}
        {tab === "chats" && <Chats user={user} />}
        {tab === "users" && <Users user={user} />}
        {tab === "announcements" && <Announcements user={user} />}
      </div>
    </div>
  );
}
