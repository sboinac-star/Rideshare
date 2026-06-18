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
        {/* Top: small text strip */}
        <div className="header-band">
          <div className="logo">🚗 NWA Ride Share</div>
          <div className="meta">
            <span>🚗 Post journey</span>
            <span>·</span>
            <span>🙋 Request ride</span>
            <span>·</span>
            <span>💬 Message</span>
            <span>·</span>
            <span>✅ Free</span>
          </div>
        </div>

        {/* QR — dominates */}
        <div className="qr-section">
          <div className="qr-box">
            <QRCode value={APP_URL} size={320} />
          </div>
          <div className="scan-label">Scan to find or post a ride</div>
          <div className="url">{APP_URL}</div>
        </div>

        {/* Footer */}
        <div className="footer-band">
          Free · No app needed · Northwest Arkansas · nwa-rideshare.vercel.app
        </div>
      </div>

      <style>{`
        #flyer {
          width: 520px;
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
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          color: #fff;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .logo { font-size: 16px; font-weight: 900; white-space: nowrap; }
        .meta { display: flex; gap: 7px; align-items: center; font-size: 13px; font-weight: 600; color: #fff; flex-wrap: wrap; justify-content: flex-end; }

        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px 24px;
          gap: 14px;
          flex: 1;
        }
        .qr-box {
          border: 5px solid #2563eb;
          border-radius: 16px;
          padding: 16px;
          background: #fff;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .scan-label {
          font-size: 15px;
          font-weight: 800;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
        }
        .url { font-size: 13px; font-weight: 600; color: #1e40af; font-family: monospace; }

        .footer-band {
          background: #1e3a8a;
          color: #93c5fd;
          text-align: center;
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 600;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }

        @media print {
          @page { margin: 15mm; }
          html, body { margin: 0; padding: 0; background: #fff; }
          .print\\:hidden { display: none !important; }
          #flyer { width: 100%; box-shadow: none; border-radius: 0; margin: 0; }
        }
      `}</style>
    </>
  );
}
