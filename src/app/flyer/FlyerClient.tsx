"use client";

import QRCode from "react-qr-code";
import Link from "next/link";

const APP_URL = "https://nwa-rideshare.vercel.app";

export default function FlyerClient() {
  return (
    <>
      {/* Screen: print button */}
      <div className="print:hidden flex justify-center gap-3 py-6 bg-gray-100">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
        >
          🖨️ Print / Save as PDF
        </button>
        <Link
          href="/about"
          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-5 py-2.5 rounded-xl text-sm transition"
        >
          ← Back
        </Link>
      </div>

      {/* A4 Flyer */}
      <div id="flyer">
        {/* Top blue band */}
        <div className="header-band">
          <div className="logo">🚗 NWA Ride Share</div>
          <div className="tagline">Free community carpooling for Northwest Arkansas</div>
        </div>

        {/* Main content */}
        <div className="body">
          {/* Left: info */}
          <div className="left">
            <h2 className="headline">Need a ride?<br />Offering a seat?</h2>
            <p className="sub">
              NWA Ride Share is a <strong>free</strong> community board connecting drivers and passengers across Northwest Arkansas — no app, no fees, no hassle.
            </p>

            <div className="features">
              {[
                { icon: "🚗", title: "Post a Journey", desc: "Share your route and pick up passengers heading your way." },
                { icon: "🙋", title: "Request a Ride", desc: "Post where you need to go and let drivers find you." },
                { icon: "💬", title: "Message Directly", desc: "Chat with drivers or passengers before you commit." },
                { icon: "✅", title: "100% Free", desc: "No account needed. Works on any phone or computer." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="feature-item">
                  <span className="feature-icon">{icon}</span>
                  <div>
                    <div className="feature-title">{title}</div>
                    <div className="feature-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cities">
              📍 Fayetteville · Springdale · Rogers · Bentonville · and beyond
            </div>
          </div>

          {/* Right: QR */}
          <div className="right">
            <div className="qr-box">
              <QRCode value={APP_URL} size={200} />
            </div>
            <div className="scan-label">Scan to open</div>
            <div className="url">{APP_URL}</div>
            <div className="cta">Find or post a ride in seconds</div>
          </div>
        </div>

        {/* Footer band */}
        <div className="footer-band">
          <span>No fees</span>
          <span className="dot">·</span>
          <span>No downloads</span>
          <span className="dot">·</span>
          <span>Community-run</span>
          <span className="dot">·</span>
          <span>nwa-rideshare.vercel.app</span>
        </div>
      </div>

      <style>{`
        /* ── Screen preview ─────────────────────────────── */
        #flyer {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 40px;
          background: #fff;
          display: flex;
          flex-direction: column;
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          box-shadow: 0 4px 32px rgba(0,0,0,0.18);
        }

        .header-band {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%);
          color: #fff;
          padding: 36px 48px 32px;
          text-align: center;
        }
        .logo {
          font-size: 38px;
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .tagline {
          margin-top: 8px;
          font-size: 15px;
          color: #bfdbfe;
          font-weight: 500;
        }

        .body {
          flex: 1;
          display: flex;
          gap: 0;
          padding: 40px 48px;
          align-items: flex-start;
        }

        /* Left column */
        .left {
          flex: 1;
          padding-right: 36px;
          border-right: 2px solid #e5e7eb;
        }
        .headline {
          font-size: 28px;
          font-weight: 900;
          color: #1e3a8a;
          line-height: 1.15;
          margin-bottom: 14px;
        }
        .sub {
          font-size: 13px;
          color: #374151;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
        }
        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #eff6ff;
          border-radius: 12px;
          padding: 12px 14px;
        }
        .feature-icon { font-size: 20px; line-height: 1; margin-top: 1px; }
        .feature-title { font-size: 13px; font-weight: 700; color: #1e40af; }
        .feature-desc  { font-size: 11.5px; color: #4b5563; margin-top: 2px; line-height: 1.5; }

        .cities {
          font-size: 11px;
          color: #6b7280;
          background: #f9fafb;
          border-radius: 8px;
          padding: 10px 14px;
          line-height: 1.6;
        }

        /* Right column */
        .right {
          width: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-left: 36px;
          gap: 12px;
        }
        .qr-box {
          border: 5px solid #2563eb;
          border-radius: 16px;
          padding: 14px;
          background: #fff;
        }
        .scan-label {
          font-size: 15px;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .url {
          font-size: 10px;
          color: #6b7280;
          font-family: monospace;
          word-break: break-all;
          text-align: center;
        }
        .cta {
          background: #2563eb;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 999px;
          text-align: center;
        }

        .footer-band {
          background: #1e3a8a;
          color: #93c5fd;
          padding: 14px 48px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 500;
          flex-wrap: wrap;
        }
        .dot { color: #3b82f6; font-weight: 900; }

        /* ── Print ─────────────────────────────────────── */
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; background: #fff; }

          .print\\:hidden { display: none !important; }

          #flyer {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            box-shadow: none;
          }

          .header-band { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .footer-band  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .feature-item { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .cta          { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .qr-box       { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}
