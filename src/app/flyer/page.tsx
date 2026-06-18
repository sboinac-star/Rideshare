import QRCode from "react-qr-code";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Printable Flyer — NWA Ride Share",
  description: "Print a flyer to share NWA Ride Share with your community.",
};

const APP_URL = "https://nwa-rideshare.vercel.app";

export default function FlyerPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      {/* Print button — hidden when printing */}
      <div className="print:hidden mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
        >
          🖨️ Print flyer
        </button>
        <a
          href="/about"
          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-5 py-2.5 rounded-xl text-sm transition"
        >
          ← Back
        </a>
      </div>

      {/* Flyer — fills A4 / letter when printed */}
      <div
        id="flyer"
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:w-full"
      >
        {/* Header band */}
        <div className="bg-blue-600 text-white text-center py-8 px-6">
          <div className="text-4xl font-extrabold tracking-tight leading-tight">NWA Ride Share</div>
          <div className="mt-2 text-blue-100 text-base font-medium">Free community carpooling for Northwest Arkansas</div>
        </div>

        {/* Body */}
        <div className="px-8 py-8 flex flex-col items-center gap-6">
          {/* QR */}
          <div className="border-4 border-blue-600 rounded-2xl p-4 bg-white">
            <QRCode value={APP_URL} size={180} />
          </div>

          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 mb-1">Scan to find or post a ride</p>
            <p className="text-gray-500 text-sm font-mono">{APP_URL}</p>
          </div>

          {/* Feature bullets */}
          <div className="w-full grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: "🚗", text: "Post a journey & find passengers" },
              { icon: "🙋", text: "Request a ride on your schedule" },
              { icon: "💬", text: "Message drivers & passengers" },
              { icon: "✅", text: "100% free — no app needed" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2.5">
                <span className="text-base shrink-0">{icon}</span>
                <span className="text-gray-700 font-medium leading-snug">{text}</span>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <p className="text-center text-gray-500 text-xs leading-relaxed max-w-xs">
            Connecting drivers and passengers across Fayetteville, Springdale, Rogers, Bentonville, and beyond.
          </p>
        </div>

        {/* Footer band */}
        <div className="bg-gray-50 border-t border-gray-200 text-center py-4 px-6">
          <p className="text-gray-400 text-xs">No fees · No downloads · Community-run</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          #flyer {
            width: 100%;
            border-radius: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
