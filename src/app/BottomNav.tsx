"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { subscribeToUserChats } from "@/lib/chat";
import type { Chat } from "@/lib/types";

const LAST_READ_KEY = (uid: string) => `nwa_lastReadMessages_${uid}`;

// Each tab has its own identity color
const TAB_COLORS = {
  "/":          { from: "#3b82f6", to: "#6366f1", shadow: "rgba(99,102,241,0.45)" },
  "/driver":    { from: "#10b981", to: "#059669", shadow: "rgba(16,185,129,0.45)" },
  "/passenger": { from: "#f59e0b", to: "#f97316", shadow: "rgba(249,115,22,0.45)" },
  "/my-rides":  { from: "#8b5cf6", to: "#6d28d9", shadow: "rgba(139,92,246,0.45)" },
  "/messages":  { from: "#ec4899", to: "#db2777", shadow: "rgba(236,72,153,0.45)" },
} as Record<string, { from: string; to: string; shadow: string }>;

function BrowseIcon() {
  return (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </svg>
  );
}

function RideIcon() {
  return (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TripsIcon() {
  return (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) { setChats([]); return; }
    return subscribeToUserChats(user.uid, setChats, () => {});
  }, [user]);

  useEffect(() => {
    if (pathname === "/messages" && user) {
      localStorage.setItem(LAST_READ_KEY(user.uid), Date.now().toString());
    }
  }, [pathname, user]);

  const unreadCount = (() => {
    if (!user || chats.length === 0) return 0;
    const lastRead = Number(localStorage.getItem(LAST_READ_KEY(user.uid)) ?? 0);
    return chats.filter((c) => c.lastMessage && c.updatedAt && c.updatedAt.getTime() > lastRead).length;
  })();

  const links = [
    { href: "/",          label: "Browse",   Icon: BrowseIcon  },
    { href: "/driver",    label: "Drive",    Icon: DriveIcon   },
    { href: "/passenger", label: "Ride",     Icon: RideIcon    },
    { href: "/my-rides",  label: "My Trips", Icon: TripsIcon   },
    { href: "/messages",  label: "Chat",     Icon: ChatIcon, badge: unreadCount },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Frosted glass bar */}
      <div
        className="mx-3 mb-2 rounded-2xl flex h-[62px] px-1 items-center"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
          border: "1px solid rgba(255,255,255,0.7)",
        }}
      >
        {links.map(({ href, label, Icon, badge }) => {
          const active = pathname === href;
          const color = TAB_COLORS[href] ?? TAB_COLORS["/"];

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Icon container */}
              <div
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                  width: active ? 48 : 40,
                  height: active ? 36 : 32,
                  borderRadius: active ? 12 : 10,
                  background: active
                    ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                    : "transparent",
                  boxShadow: active
                    ? `0 4px 14px ${color.shadow}`
                    : "none",
                  transform: active ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                <span
                  style={{
                    color: active ? "#fff" : "#9ca3af",
                    display: "flex",
                    transition: "color 0.2s",
                  }}
                >
                  <Icon />
                </span>

                {/* Unread badge */}
                {badge ? (
                  <span
                    className="absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1"
                    style={{
                      background: "#ef4444",
                      minWidth: 16,
                      height: 16,
                      boxShadow: "0 2px 6px rgba(239,68,68,0.6)",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-bold leading-none tracking-wide transition-all duration-200"
                style={{
                  color: active ? color.from : "#9ca3af",
                  transform: active ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
