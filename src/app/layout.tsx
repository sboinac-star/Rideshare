import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavHeader from "./NavHeader";
import ToastProvider from "./ToastProvider";
import AuthProvider from "./AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "NWA Ride Share",
  description:
    "Carpooling and ride sharing in Northwest Arkansas — Fayetteville, Bentonville, Rogers, Springdale and beyond. Find or post a ride today.",
  metadataBase: new URL("https://nwa-rideshare.vercel.app"),
  openGraph: {
    title: "NWA Ride Share",
    description:
      "Free carpooling board for Northwest Arkansas. Find or post a ride across NWA and beyond.",
    siteName: "NWA Ride Share",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NWA Ride Share",
    description:
      "Free carpooling board for Northwest Arkansas. Find or post a ride across NWA and beyond.",
  },
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
      <head>
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://www.googleapis.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <NavHeader />
            <main className="flex-1">{children}</main>
            <footer className="bg-red-50 border-t border-red-200 px-4 py-4 text-center">
              <p className="text-red-600 text-sm sm:text-xs font-medium leading-snug max-w-2xl mx-auto">
                <strong>Disclaimer:</strong> NWA Ride Share is a free community board and is not responsible for fraud, scams, identity theft, personal safety incidents, or any harm arising from interactions between users. Always meet in public places, verify the identity of drivers and passengers, never share sensitive financial information, and use your best judgment. Ride arrangements are solely between the parties involved. Use this service at your own risk.
              </p>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
