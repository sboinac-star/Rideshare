import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import app, { db } from "./firebase";

export async function registerPushToken(uid: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (!(await isSupported())) return;
    if (Notification.permission === "denied") return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: sw,
    });
    if (!token) return;

    await setDoc(doc(db, "fcmTokens", uid), { token, updatedAt: serverTimestamp() });
  } catch (e) {
    console.error("[push] registerPushToken:", e);
  }
}

export async function unregisterPushToken(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "fcmTokens", uid));
  } catch {
    // best effort
  }
}
