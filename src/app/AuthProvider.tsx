"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  authLoading: boolean;
  otpSent: boolean;
  sendOTP: (phone: string) => Promise<void>;
  confirmOTP: (code: string) => Promise<void>;
  resetOTP: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const sendOTP = async (phone: string) => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
    // Remove and recreate the container so the reCAPTCHA library sees a fresh element
    const old = document.getElementById("recaptcha-container");
    if (old) old.remove();
    const el = document.createElement("div");
    el.id = "recaptcha-container";
    document.body.appendChild(el);

    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    const result = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
    confirmationRef.current = result;
    setOtpSent(true);
  };

  const confirmOTP = async (code: string) => {
    if (!confirmationRef.current) throw new Error("No OTP in progress");
    await confirmationRef.current.confirm(code);
    confirmationRef.current = null;
    setOtpSent(false);
  };

  const resetOTP = () => {
    setOtpSent(false);
    confirmationRef.current = null;
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, otpSent, sendOTP, confirmOTP, resetOTP, signOut }}>
      {children}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
}
