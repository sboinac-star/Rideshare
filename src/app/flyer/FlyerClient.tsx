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
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="cities">
              📍 Fayetteville · Springdale · Rogers · Bentonville & beyond
            </div>
          </div>

          {/* Right: QR */}
          <div className="right">
            <div className="qr-box">
              <QRCode value={APP_URL} size={240} />
            </div>
            <div className="scan-label">Scan to open</div>
            <div className="url">{APP_URL}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-band">
          No fees · No downloads · Community-run · nwa-rideshare.vercel.app
        </div>
      </div>

      <style>{`
        #flyer {
          width: 210mm;
          height: 297mm;
          margin: 0 auto 32px;
          background: #fff;
          display: flex;
          flex-direction: column;
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          box-shadow: 0 4px 32px rgba(0,0,0,0.15);
          overflow: hidden;
          box-sizing: border-box;
        }

        .header-band {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%);
          color: #fff;
          padding: 28px 44px 24px;
          text-align: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .logo    { font-size: 34px; font-weight: 900; letter-spacing: -0.5px; }
        .tagline { font-size: 13px; color: #bfdbfe; margin-top: 6px; }

        .body {
          flex: 1;
          display: flex;
          padding: 32px 44px;
          gap: 32px;
          align-items: center;
          overflow: hidden;
        }

        .left {
          flex: 1;
          padding-right: 32px;
          border-right: 2px solid #e5e7eb;
        }
        .headline {
          font-size: 26px;
          font-weight: 900;
          color: #1e3a8a;
          line-height: 1.2;
          margin-bottom: 10px;
        }
        .sub {
          font-size: 12px;
          color: #374151;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #eff6ff;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #1e40af;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .feature-item span:first-child { font-size: 16px; }

        .cities {
          font-size: 10.5px;
          color: #6b7280;
          background: #f9fafb;
          border-radius: 8px;
          padding: 8px 12px;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .right {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .qr-box {
          border: 5px solid #2563eb;
          border-radius: 16px;
          padding: 14px;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .scan-label {
          font-size: 14px;
          font-weight: 800;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .url {
          font-size: 9.5px;
          color: #6b7280;
          font-family: monospace;
          text-align: center;
        }

        .footer-band {
          background: #1e3a8a;
          color: #93c5fd;
          text-align: center;
          padding: 12px 44px;
          font-size: 11px;
          font-weight: 500;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; background: #fff; }
          .print\\:hidden { display: none !important; }
          #flyer {
            width: 210mm;
            height: 297mm;
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </>
  );
}
