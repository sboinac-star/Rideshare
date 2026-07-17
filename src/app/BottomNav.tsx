"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { subscribeToUserChats } from "@/lib/chat";
import type { Chat } from "@/lib/types";

const LAST_READ_KEY = (uid: string) => `nwa_lastReadMessages_${uid}`;

const TABS = [
  {
    href: "/",
    label: "Browse",
    color: "#2563eb",
    bg: "#eff6ff",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" clipRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"/>
      </svg>
    ),
    IconOutline: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <circle cx="10.5" cy="10.5" r="6.75"/><path strokeLinecap="round" d="m21 21-4.69-4.69"/>
      </svg>
    ),
  },
  {
    href: "/driver",
    label: "Drive",
    color: "#059669",
    bg: "#ecfdf5",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875H3.75a3.375 3.375 0 0 0 6.75 0h2.625a1.875 1.875 0 0 0 1.875-1.875V15Z"/>
        <path d="M8.25 19.5a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Z"/>
        <path d="M15 6.75a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 1 .75.75v11.25a.75.75 0 0 1-.75.75H15a.75.75 0 0 0 0 1.5h1.5a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25H15Z"/>
        <path d="M19.5 19.5a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Z"/>
      </svg>
    ),
    IconOutline: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
        <circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>
      </svg>
    ),
  },
  {
    href: "/passenger",
    label: "Ride",
    color: "#9333ea",
    bg: "#fffbeb",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"/>
      </svg>
    ),
    IconOutline: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <circle cx="12" cy="7" r="4"/><path strokeLinecap="round" d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
      </svg>
    ),
  },
  {
    href: "/my-rides",
    label: "My Trips",
    color: "#ea580c",
    bg: "#f5f3ff",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Zm9.586 4.594a.75.75 0 0 0-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.116-.062l3-3.75Z"/>
      </svg>
    ),
    IconOutline: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4"/>
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Chat",
    color: "#db2777",
    bg: "#fdf2f8",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" clipRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.155L8.5 21.5a.75.75 0 0 1-1.333-.473v-3.977a49.5 49.5 0 0 1-2.319-.298c-1.978-.292-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"/>
      </svg>
    ),
    IconOutline: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
    ),
  },
];

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

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="mx-3 mb-2 rounded-2xl flex h-[64px] items-center px-2"
        style={{
          background: "rgba(255,255,255,0.97)",
          boxShadow: "0 -1px 0 rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.16), 0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        {TABS.map(({ href, label, color, Icon, IconOutline }) => {
          const active = pathname === href;
          const showBadge = href === "/messages" && unreadCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Active dot indicator at top */}
              <div
                className="absolute top-0 rounded-full transition-all duration-300"
                style={{
                  width: active ? 20 : 0,
                  height: 3,
                  background: active ? color : "transparent",
                  top: -2,
                }}
              />

              {/* Icon pill — solid color when active, white icon on top */}
              <div
                className="relative flex items-center justify-center transition-all duration-200"
                style={{
                  width: 48,
                  height: 34,
                  borderRadius: 11,
                  background: active ? color : "transparent",
                  boxShadow: active ? `0 4px 12px ${color}66` : "none",
                }}
              >
                <span style={{ color: active ? "#ffffff" : color, opacity: active ? 1 : 0.65, display: "flex" }}>
                  {active ? <Icon /> : <IconOutline />}
                </span>

                {showBadge && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-[9px] font-black rounded-full flex items-center justify-center"
                    style={{
                      background: "#ef4444",
                      minWidth: 16,
                      height: 16,
                      padding: "0 3px",
                      boxShadow: "0 2px 6px rgba(239,68,68,0.5)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-bold leading-none transition-all duration-200"
                style={{ color: active ? color : color, opacity: active ? 1 : 0.6 }}
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
