"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

const SOCIAL_DOMAINS = ["instagram.com", "facebook.com", "linkedin.com", "twitter.com", "x.com", "tiktok.com"];

function isValidSocialUrl(url: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return SOCIAL_DOMAINS.some((d) => u.hostname.includes(d));
  } catch { return false; }
}

type Props = {
  onComplete: (name: string) => void;
};

export default function OnboardingModal({ onComplete }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const maskedPhone = (() => {
    const digits = (user?.phoneNumber ?? "").replace(/\D/g, "");
    return digits.length >= 4 ? `●●●● ${digits.slice(-4)}` : "";
  })();

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (socialUrl && !isValidSocialUrl(socialUrl)) {
      setError("Please enter a valid Instagram, Facebook, LinkedIn or X link");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = await user!.getIdToken();
      await fetch("/api/profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim(), socialUrl: socialUrl.trim() }),
      });
      onComplete(name.trim());
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top illustration */}
      <div className="bg-blue-600 px-6 pt-12 pb-8 text-center">
        <div className="text-5xl mb-3">👋</div>
        <h1 className="text-2xl font-extrabold text-white">Welcome!</h1>
        <p className="text-blue-100 text-sm mt-1">Set up your profile so riders trust you</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col gap-6 overflow-y-auto">

        {/* Phone (read-only reassurance) */}
        {maskedPhone && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <span className="text-green-600 text-lg">✓</span>
            <div>
              <p className="text-xs font-bold text-green-700">Phone verified</p>
              <p className="text-sm text-green-600">{maskedPhone}</p>
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chandra S."
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-blue-500 transition"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <p className="text-xs text-gray-400 mt-1">Shown on your ride listings — first name + last initial is fine</p>
        </div>

        {/* Social link */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5">
            Social profile <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔗</span>
            <input
              type="url"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              placeholder="instagram.com/yourname"
              className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["instagram.com/", "facebook.com/", "linkedin.com/in/"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSocialUrl(s)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full transition"
              >
                {s.split(".com")[0]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Adds a 🔗 trust badge to your listings. Passengers and drivers feel safer when they can look you up.</p>
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold py-4 rounded-2xl transition text-base shadow-lg"
        >
          {saving ? "Saving…" : "Get started →"}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">You can update this anytime in My Account</p>
      </div>
    </div>
  );
}
