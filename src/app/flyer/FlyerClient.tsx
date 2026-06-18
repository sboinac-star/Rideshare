"use client";

import QRCode from "react-qr-code";
import Link from "next/link";

const APP_URL = "https://nwa-rideshare.vercel.app";

export default function FlyerClient() {
  return (
    <>
      <div className="print:hidden flex justify-center gap-3 py-4 bg-gray-100">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition"
        >
          🖨️ Print / Save as PDF
        </button>
        <Link href="/about" className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2 rounded-xl text-sm transition">
          ← Back
        </Link>
      </div>

      <div id="flyer">
        {/* Header */}
        <div className="header-band">
          <div className="logo">🚗 NWA Ride Share</div>
          <div className="tagline">Free community carpooling · Northwest Arkansas</div>
        </div>

        {/* Body */}
        <div className="body">
          {/* Left */}
          <div className="left">
            <h2 className="headline">Need a ride?<br />Have a seat?</h2>
            <p className="sub">Free board connecting drivers & passengers across NWA. No app. No fees.</p>

            <div className="features">
              {[
                { icon: "🚗", text: "Post your journey" },
                { icon: "🙋", text: "Request a ride" },
                { icon: "💬", text: "Message directly" },
                { icon: "✅", text: "100% free" },
              ].map(({ icon, text }) => (
                <div key={text} className="feature-item">
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>

            <div className="cities">
              📍 Fayetteville · Springdale · Rogers · Bentonville & beyond
            </div>
          </div>

          {/* Right */}
          <div className="right">
            <div className="qr-box">
              <QRCode value={APP_URL} size={220} />
            </div>
            <div className="scan-label">Scan to open</div>
            <div className="url">{APP_URL}</div>
          </div>
        </div>

        <div className="footer-band">
          No fees · No downloads · Community-run · nwa-rideshare.vercel.app
        </div>
      </div>

      <style>{`
        #flyer {
          width: 680px;
          margin: 0 auto 32px;
          background: #fff;
          display: flex;
          flex-direction: column;
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          border-radius: 12px;
          overflow: hidden;
        }
        .header-band {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%);
          color: #fff;
          padding: 24px 36px 20px;
          text-align: center;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .logo    { font-size: 30px; font-weight: 900; }
        .tagline { font-size: 12px; color: #bfdbfe; margin-top: 5px; }

        .body {
          display: flex;
          padding: 28px 36px;
          gap: 28px;
          align-items: center;
        }
        .left {
          flex: 1;
          padding-right: 28px;
          border-right: 2px solid #e5e7eb;
        }
        .headline { font-size: 24px; font-weight: 900; color: #1e3a8a; line-height: 1.2; margin-bottom: 10px; }
        .sub      { font-size: 12px; color: #374151; line-height: 1.6; margin-bottom: 18px; }

        .features { display: flex; flex-direction: column; gap: 7px; margin-bottom: 18px; }
        .feature-item {
          display: flex; align-items: center; gap: 9px;
          background: #eff6ff; border-radius: 9px;
          padding: 8px 11px; font-size: 12px; font-weight: 600; color: #1e40af;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .feature-item span:first-child { font-size: 15px; }

        .cities {
          font-size: 10px; color: #6b7280;
          background: #f9fafb; border-radius: 7px; padding: 7px 11px; line-height: 1.5;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }

        .right { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .qr-box {
          border: 4px solid #2563eb; border-radius: 14px; padding: 12px; background: #fff;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .scan-label { font-size: 13px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; }
        .url        { font-size: 9px; color: #6b7280; font-family: monospace; text-align: center; }

        .footer-band {
          background: #1e3a8a; color: #93c5fd;
          text-align: center; padding: 11px 36px;
          font-size: 10.5px; font-weight: 500;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }

        @media print {
          @page { margin: 12mm; }
          html, body { margin: 0; padding: 0; background: #fff; }
          .print\\:hidden { display: none !important; }
          #flyer { width: 100%; box-shadow: none; border-radius: 0; margin: 0; }
        }
      `}</style>
    </>
  );
}
