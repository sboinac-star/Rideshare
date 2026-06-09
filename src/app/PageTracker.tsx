"use client";

import { useEffect } from "react";

export default function PageTracker() {
  useEffect(() => {
    fetch("/api/track", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
