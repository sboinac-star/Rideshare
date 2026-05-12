"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import SignInModal from "./SignInModal";

const links = [
  { href: "/", label: "Browse" },
  { href: "/driver", label: "Post Journey" },
  { href: "/passenger", label: "Request Ride" },
  { href: "/messages", label: "Messages" },
  { href: "/about", label: "About" },
];

function maskedPhone(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `●●●● ${digits.slice(-4)}`;
}

export default function NavHeader() {
  const [open, setOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const pathname = usePathname();
  const { user, authLoading, signOut } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight" onClick={() => setOpen(false)}>
            NWA Ride Share
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "text-white underline underline-offset-4" : "hover:text-blue-100 transition"}
              >
                {label}
              </Link>
            ))}
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-3 border-l border-blue-500 pl-4">
                  <span className="text-blue-100 text-xs">{maskedPhone(user.phoneNumber)}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-xs bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg transition"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-xs bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg transition border-l border-blue-500 ml-1 pl-4"
                >
                  Sign in
                </button>
              )
            )}
          </div>

          {/* Hamburger button */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-blue-700 transition"
            aria-label="Toggle menu"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="sm:hidden border-t border-blue-500 bg-blue-600 px-4 pb-4 flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`py-2 text-sm font-medium rounded px-2 ${
                  pathname === href ? "bg-blue-700 text-white" : "hover:bg-blue-700 transition"
                }`}
              >
                {label}
              </Link>
            ))}
            {!authLoading && (
              user ? (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-500">
                  <span className="text-blue-100 text-xs">{maskedPhone(user.phoneNumber)}</span>
                  <button onClick={() => { signOut(); setOpen(false); }} className="text-xs bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg transition">
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowSignIn(true); setOpen(false); }}
                  className="mt-2 w-full text-sm bg-white text-blue-700 font-bold py-2 rounded-lg"
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
