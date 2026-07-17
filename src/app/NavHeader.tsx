"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import SignInModal from "./SignInModal";
import { subscribeToUserChats, markChatRead, countUnreadChats } from "@/lib/chat";
import type { Chat } from "@/lib/types";

const ADMIN_PHONES = (process.env.NEXT_PUBLIC_ADMIN_PHONES ?? "")
  .split(",").map((p) => p.trim()).filter(Boolean);

function maskedPhone(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `●●●● ${digits.slice(-4)}`;
}

export default function NavHeader() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const pathname = usePathname();
  const { user, authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!user) { setChats([]); return; }
    const unsub = subscribeToUserChats(user.uid, setChats, () => {});
    return unsub;
  }, [user]);

  const [readVersion, setReadVersion] = useState(0);

  useEffect(() => {
    if (pathname === "/messages" && user && chats.length > 0) {
      chats.forEach((c) => markChatRead(user.uid, c.id));
      setReadVersion((v) => v + 1);
    }
  }, [pathname, user, chats]);

  const unreadCount = user ? countUnreadChats(user.uid, chats) : 0;
  void readVersion;

  const isAdmin = !!user && ADMIN_PHONES.includes(user.phoneNumber ?? "");

  const navLinks = [
    { href: "/", label: "Browse" },
    { href: "/driver", label: "Post Journey" },
    { href: "/passenger", label: "Request Ride" },
    { href: "/my-rides", label: "My Rides" },
    { href: "/messages", label: "Messages", badge: unreadCount },
    { href: "/resources", label: "Resources" },
    { href: "/about", label: "About" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 shadow-md">
        <nav className="max-w-7xl mx-auto px-4 h-14 flex justify-between items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-base shadow-inner">🚗</span>
            <span className="text-lg font-extrabold text-white tracking-tight">
              NWA <span className="font-light">Rides</span>
            </span>
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

          {/* Auth — desktop full, mobile compact */}
          <div className="flex items-center gap-2 shrink-0">
            {!authLoading && (
              user ? (
                <>
                  <span className="hidden sm:block text-blue-300 text-xs">{maskedPhone(user.phoneNumber)}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-xs sm:text-sm text-blue-100 hover:text-white bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-lg transition font-medium"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="bg-white hover:bg-blue-50 text-blue-900 text-sm font-bold px-4 py-1.5 rounded-lg transition shadow-sm"
                >
                  Sign in
                </button>
              )
            )}
          </div>
        </nav>
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
