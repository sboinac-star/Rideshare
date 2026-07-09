"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import Link from "next/link";

const PLATFORM_HINTS = [
  { label: "Facebook", placeholder: "https://facebook.com/yourname" },
  { label: "LinkedIn", placeholder: "https://linkedin.com/in/yourname" },
  { label: "Instagram", placeholder: "https://instagram.com/yourname" },
  { label: "X / Twitter", placeholder: "https://x.com/yourname" },
];

function detectPlatform(url: string) {
  try {
    const host = new URL(url).hostname;
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("twitter") || host.includes("x.com")) return "X / Twitter";
  } catch { /* ignore */ }
  return null;
}

export default function ProfilePage() {
  const { user, authLoading } = useAuth();
  const toast = useToast();
  const [socialUrl, setSocialUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ completedCount: 0, cancelCount: 0 });

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          setSocialUrl(data.socialUrl ?? "");
          setStats({ completedCount: data.completedCount ?? 0, cancelCount: data.cancelCount ?? 0 });
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
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
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Sign in to view your profile.</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to browse</Link>
        </div>
      </div>
    );
  }

  const platform = detectPlatform(socialUrl);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to browse</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">This information helps others trust you before agreeing to share a ride.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.completedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Rides completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-3xl font-bold ${stats.cancelCount >= 3 ? "text-orange-500" : "text-gray-900"}`}>{stats.cancelCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Cancellations</p>
          </div>
        </div>

        {/* Social link */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Social profile link <span className="text-gray-400 font-normal">(optional)</span></h2>
          <p className="text-xs text-gray-500 mb-4">
            Add a public Facebook, LinkedIn, Instagram, or X profile so riders can verify who you are.
            This will show as a link on your listings.
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="url"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              placeholder={PLATFORM_HINTS[0].placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {platform && (
              <p className="text-xs text-green-600 font-medium">✓ {platform} profile detected</p>
            )}

            <div className="flex flex-wrap gap-2">
              {PLATFORM_HINTS.map(({ label, placeholder }) => (
                <button
                  key={label}
                  onClick={() => setSocialUrl(placeholder)}
                  className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-2.5 py-1 rounded-full transition"
                >
                  {label}
                </button>
              ))}
            </div>

            {socialUrl && (
              <a
                href={socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Preview link →
              </a>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            {socialUrl && (
              <button
                onClick={() => setSocialUrl("")}
                className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg transition"
              >
                Remove
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition text-sm"
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Your phone number is never shown publicly. Only your name, ride history, and optional social link are visible to others.
        </p>
      </div>
    </div>
  );
}
