"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

const IS_TEST_ENV =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

const TEST_PHONE = "+19999990001";
const TEST_CODE = "123456";

type Props = {
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
};

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export default function SignInModal({ onClose, onSuccess, title = "Sign in to continue" }: Props) {
  const { sendOTP, confirmOTP, otpSent, resetOTP } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a valid phone number"); return; }
    setSending(true);
    try {
      await sendOTP(toE164(phone));
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      const serverResponse = (e as { customData?: { serverResponse?: string } })?.customData?.serverResponse ?? "";
      const msg = code || (e instanceof Error ? e.message : String(e));
      if (msg.includes("invalid-phone-number")) setError("Invalid phone number.");
      else if (msg.includes("too-many-requests")) setError("Too many attempts. Try again later.");
      else if (msg.includes("unauthorized-domain")) setError("Domain not authorized in Firebase. Add nwa-rideshare.vercel.app to Firebase Auth authorized domains.");
      else if (msg.includes("captcha-check-failed") || msg.includes("recaptcha")) setError("Security check failed. Please refresh the page and try again.");
      else if (msg.includes("BILLING_NOT_ENABLED") || serverResponse.includes("BILLING_NOT_ENABLED")) setError("Firebase billing not enabled. Upgrade to Blaze plan or use a test phone number.");
      else if (msg.includes("internal-error")) setError(`Internal error${serverResponse ? ": " + serverResponse : " — check browser console for details."}`);
      else setError(msg || "Failed to send code. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (code.length !== 6) { setError("Enter the 6-digit code"); return; }
    setVerifying(true);
    try {
      await confirmOTP(code);
      onSuccess?.();
      onClose();
    } catch {
      setError("Incorrect code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-5">We&apos;ll text a 6-digit code to verify your number.</p>

        {IS_TEST_ENV && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <span className="font-semibold">Test env</span> — use{" "}
            <span className="font-mono font-semibold">{TEST_PHONE}</span> / code{" "}
            <span className="font-mono font-semibold">{TEST_CODE}</span>
            {!otpSent && (
              <button
                type="button"
                onClick={() => setPhone(TEST_PHONE)}
                className="ml-2 underline hover:no-underline"
              >
                fill
              </button>
            )}
          </div>
        )}

        {!otpSent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(479) 555-0123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-lg transition"
            >
              {sending ? "Sending..." : "Send Code"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Code sent to <span className="font-medium">{phone}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-lg transition"
            >
              {verifying ? "Verifying..." : "Verify & Continue"}
            </button>
            <button
              onClick={() => { setCode(""); setError(""); resetOTP(); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              ← Change phone number
            </button>
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 py-1">
          Cancel
        </button>
      </div>
    </div>
  );
}
