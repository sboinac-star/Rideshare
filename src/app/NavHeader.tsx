"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Browse" },
  { href: "/driver", label: "Post Journey" },
  { href: "/passenger", label: "Request Ride" },
  { href: "/about", label: "About" },
];

export default function NavHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight" onClick={() => setOpen(false)}>
          NWA Ride Share
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex gap-6 text-sm font-medium">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "text-white underline underline-offset-4" : "hover:text-blue-100 transition"}
            >
              {label}
            </Link>
          ))}
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
        </div>
      )}
    </header>
  );
}
