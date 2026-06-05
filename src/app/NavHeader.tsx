"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import SignInModal from "./SignInModal";
import { subscribeToUserChats } from "@/lib/chat";
import type { Chat } from "@/lib/types";

const LAST_READ_KEY = (uid: string) => `nwa_lastReadMessages_${uid}`;

const ADMIN_PHONES = (process.env.NEXT_PUBLIC_ADMIN_PHONES ?? "")
  .split(",").map((p) => p.trim()).filter(Boolean);

function maskedPhone(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `●●●● ${digits.slice(-4)}`;
}

export default function NavHeader() {
  const [open, setOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const pathname = usePathname();
  const { user, authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!user) { setChats([]); return; }
    const unsub = subscribeToUserChats(user.uid, setChats, () => {});
    return unsub;
  }, [user]);

  useEffect(() => {
    if (pathname === "/messages" && user) {
      localStorage.setItem(LAST_READ_KEY(user.uid), Date.now().toString());
    }
  }, [pathname, user]);

  const unreadCount = (() => {
    if (!user || chats.length === 0) return 0;
    const lastRead = Number(localStorage.getItem(LAST_READ_KEY(user.uid)) ?? 0);
    return chats.filter(
      (c) => c.lastMessage && c.updatedAt && c.updatedAt.getTime() > lastRead
    ).length;
  })();

  const isAdmin = !!user && ADMIN_PHONES.includes(user.phoneNumber ?? "");

  const navLinks = [
    { href: "/", label: "Browse" },
    { href: "/driver", label: "Post Journey" },
    { href: "/passenger", label: "Request Ride" },
    { href: "/my-rides", label: "My Rides" },
    { href: "/messages", label: "Messages", badge: unreadCount },
    { href: "/about", label: "About" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-blue-600 shadow-md">
        <nav className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <Link
            href="/"
            className="text-xl font-bold text-white tracking-tight shrink-0"
            onClick={() => setOpen(false)}
          >
            NWA Ride Share
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-0.5 text-sm font-medium flex-1 justify-center">
            {navLinks.map(({ href, label, badge }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-2 rounded-lg transition-colors ${
                  pathname === href
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-blue-100 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {label}
                {badge ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {!authLoading && (
              user ? (
                <>
                  <span className="text-blue-300 text-xs">{maskedPhone(user.phoneNumber)}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-blue-100 hover:text-white bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-lg transition font-medium"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="bg-white hover:bg-blue-50 text-blue-900 text-sm font-bold px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Sign in
                </button>
              )
            )}
          </div>

          {/* Hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-blue-100 hover:bg-blue-800 transition"
            aria-label="Toggle menu"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="sm:hidden border-t border-blue-500 bg-blue-600 px-4 pb-4 flex flex-col gap-0.5">
            {navLinks.map(({ href, label, badge }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`relative py-3 px-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === href
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-blue-100 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {label}
                {badge ? (
                  <span className="ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </Link>
            ))}
            {!authLoading && (
              user ? (
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-blue-800">
                  <span className="text-blue-200 text-xs">{maskedPhone(user.phoneNumber)}</span>
                  <button
                    onClick={() => { signOut(); setOpen(false); }}
                    className="text-sm text-blue-100 bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg transition font-medium"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowSignIn(true); setOpen(false); }}
                  className="mt-2 w-full bg-white text-blue-900 text-sm font-bold py-3 rounded-lg transition"
                >
                  Sign in
                </button>
              )
            )}
          </div>
        )}
      </header>

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          title="Sign in with Phone"
        />
      )}
    </>
  );
}
