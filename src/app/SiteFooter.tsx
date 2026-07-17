"use client";

import Link from "next/link";
import QRCode from "react-qr-code";

const APP_URL = "https://nwa-rideshare.vercel.app";

export default function SiteFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 px-4 pt-8 pb-6 print:hidden">
      <div className="max-w-5xl mx-auto">
        {/* Top row: share strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="border-2 border-blue-200 rounded-xl p-2 bg-white shrink-0">
              <QRCode value={APP_URL} size={72} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Share NWA Ride Share</p>
              <p className="text-gray-500 text-xs mt-0.5">Scan to open on any phone — no app needed.</p>
              <Link href="/flyer" className="text-blue-600 hover:underline text-xs mt-1 inline-block">
                Print a flyer →
              </Link>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-800 transition">Browse Rides</Link>
            <Link href="/driver" className="hover:text-gray-800 transition">Post Journey</Link>
            <Link href="/passenger" className="hover:text-gray-800 transition">Request Ride</Link>
            <Link href="/resources" className="hover:text-gray-800 transition">Resources</Link>
            <Link href="/safety" className="hover:text-blue-700 transition font-medium text-blue-600">🛡️ Safety</Link>
            <Link href="/about" className="hover:text-gray-800 transition">About</Link>
          </nav>
        </div>

        {/* Bottom: disclaimer */}
        <p className="text-red-600 text-xs font-medium leading-snug max-w-3xl mx-auto mt-4 text-center">
          <strong>Disclaimer:</strong> NWA Ride Share is a free community board and is not responsible for fraud, scams, identity theft, personal safety incidents, or any harm arising from interactions between users. Always meet in public places, verify the identity of drivers and passengers, never share sensitive financial information, and use your best judgment. Ride arrangements are solely between the parties involved. Use this service at your own risk.
        </p>
      </div>
    </footer>
  );
}
