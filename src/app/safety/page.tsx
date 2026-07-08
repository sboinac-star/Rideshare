import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Safety Tips — NWA Ride Share",
  description: "Stay safe when using NWA Ride Share. Community guidelines and tips for drivers and passengers.",
};

const tips = [
  {
    icon: "📍",
    title: "Meet in a public place",
    body: "Always arrange your pickup at a busy, well-lit public location — a parking lot, coffee shop, or gas station. Never meet at a private address you are not familiar with.",
  },
  {
    icon: "📱",
    title: "Share your trip details",
    body: "Before you get in the car, send the driver's name, route, and departure time to a trusted friend or family member. Tell them when to expect you to arrive.",
  },
  {
    icon: "🔍",
    title: "Check their profile",
    body: "Look at community ratings and completed ride history before messaging. Riders with verified phone numbers and positive ratings have a track record in the community.",
  },
  {
    icon: "💬",
    title: "Communicate through the app",
    body: "Use the in-app messaging to coordinate your ride. Keep communication on-platform so there is a record of your conversation.",
  },
  {
    icon: "🚫",
    title: "Trust your instincts",
    body: "If anything feels wrong — the driver is late, the car doesn't match, or you feel uncomfortable — do not get in. Cancel and find another option. Your safety is more important than the ride.",
  },
  {
    icon: "💰",
    title: "Never pay in advance",
    body: "Agree on cost-sharing before the ride, but never send money via Venmo, Zelle, or CashApp before you are safely at your destination. Scammers often ask for upfront payment and disappear.",
  },
  {
    icon: "📸",
    title: "Verify the vehicle",
    body: "Before getting in, confirm the make, model, and license plate match what the driver described. Ask the driver to confirm your name before you enter the vehicle.",
  },
  {
    icon: "🆘",
    title: "Know your emergency contacts",
    body: "Save 911 and a trusted contact in your phone before every trip. If you feel unsafe during a ride, call 911 immediately.",
  },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-4xl mb-3">🛡️</p>
          <h1 className="text-3xl font-bold mb-2">Stay Safe on NWA Ride Share</h1>
          <p className="text-blue-100 text-base max-w-lg mx-auto">
            NWA Ride Share is a free community board — not a company like Uber or Lyft.
            There are no background checks. Please follow these guidelines every time you ride.
          </p>
        </div>
      </div>

      {/* Notice banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-start gap-2 text-sm text-yellow-800">
          <span className="text-base shrink-0 mt-0.5">⚠️</span>
          <p>
            <strong>Community platform:</strong> Anyone can post. We connect people but cannot verify identities or guarantee safety.
            Use common sense and meet in public places.
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="grid gap-4">
          {tips.map((tip) => (
            <div key={tip.title} className="bg-white rounded-xl p-5 shadow-sm flex gap-4 items-start">
              <span className="text-2xl shrink-0 mt-0.5">{tip.icon}</span>
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">{tip.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Report section */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🚨</span>
            <div>
              <h2 className="font-semibold text-red-800 mb-1">Report a safety concern</h2>
              <p className="text-sm text-red-700 leading-relaxed mb-3">
                If you experienced something unsafe, please report the listing so our team can review and remove it.
                Use the <strong>Report</strong> button on any listing, or contact us directly.
              </p>
              <Link
                href="/"
                className="inline-block text-sm font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              >
                Browse listings &amp; report
              </Link>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to rides
          </Link>
        </div>
      </div>
    </div>
  );
}
