"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { subscribeToUserChats } from "@/lib/chat";
import type { Chat } from "@/lib/types";

const LAST_READ_KEY = (uid: string) => `nwa_lastReadMessages_${uid}`;

function BrowseIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function DriveIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2m-8 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
    </svg>
  );
}

function RideIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
    </svg>
  );
}

function TripsIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
    { href: "/", label: "Browse", Icon: BrowseIcon },
    { href: "/driver", label: "Drive", Icon: DriveIcon },
    { href: "/passenger", label: "Ride", Icon: RideIcon },
    { href: "/my-rides", label: "My Trips", Icon: TripsIcon },
    { href: "/messages", label: "Chat", Icon: ChatIcon, badge: unreadCount },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex h-16 px-1">
        {links.map(({ href, label, Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all"
            >
              <div className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 ${
                active ? "bg-blue-600 w-14 h-8 shadow-md shadow-blue-200" : "w-10 h-8"
              }`}>
                <span className={active ? "text-white" : "text-gray-400"}>
                  <Icon active={active} />
                </span>
                {badge ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-3.5 flex items-center justify-center px-0.5 shadow-sm">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-semibold leading-none transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
