"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";

type Props = { blockedUid: string; blockedName: string };

export default function BlockButton({ blockedUid, blockedName }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.uid === blockedUid) return;
    user.getIdToken().then((token) =>
      fetch(`/api/block?blockedUid=${blockedUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setBlocked(d.blocked))
        .catch(() => {})
    );
  }, [user, blockedUid]);

  if (!user || user.uid === blockedUid || blocked === null) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/block", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUid }),
      });
      const data = await res.json() as { blocked: boolean };
      setBlocked(data.blocked);
      toast(
        data.blocked
          ? `${blockedName} has been blocked.`
          : `${blockedName} has been unblocked.`
      );
    } catch {
      toast("Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1 rounded-full border transition ${
        blocked
          ? "border-gray-300 text-gray-500 hover:bg-gray-50"
          : "border-red-200 text-red-600 hover:bg-red-50"
      }`}
    >
      {loading ? "..." : blocked ? "Unblock" : "Block"}
    </button>
  );
}
