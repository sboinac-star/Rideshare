import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NWA Ride Share",
  description: "Local ride shares and rides to/from nearby cities in Northwest Arkansas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="bg-blue-600 text-white shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              NWA Ride Share
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-blue-100">
                Browse Journeys
              </Link>
              <Link href="/driver" className="hover:text-blue-100">
                Post Journey
              </Link>
              <Link href="/messages" className="hover:text-blue-100">
                Messages
              </Link>
              <Link href="/rides" className="hover:text-blue-100">
                My Bookings
              </Link>
              <Link href="/driver-register" className="hover:text-blue-100">
                Become a Driver
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
