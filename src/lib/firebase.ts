import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore, getFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Offline persistence: writes resolve from local cache immediately and sync in background.
// This prevents addDoc/updateDoc/getDoc from hanging indefinitely on poor networks,
// which was causing the send button to get permanently stuck in a "sending" state.
function buildDb() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache() });
  } catch {
    // Already initialized (e.g. HMR in dev) — return existing instance
    return getFirestore(app);
  }
}

export const db = buildDb();
export const auth = getAuth(app);

// Prefixes collection names for staging isolation.
// Set NEXT_PUBLIC_COLLECTION_PREFIX=staging_ in Vercel Preview env vars.
export const col = (name: string) =>
  `${process.env.NEXT_PUBLIC_COLLECTION_PREFIX ?? ""}${name}`;

if (process.env.NODE_ENV === "development" && !auth.emulatorConfig) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

export default app;
