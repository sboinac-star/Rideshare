import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  const existing = getApps().find((a) => a.name === "admin");
  if (existing) return existing;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  }, "admin");
}

export const adminDb = () => getFirestore(getAdminApp());
export const adminAuth = () => getAuth(getAdminApp());

export function getAdminPhones(): string[] {
  return (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function verifyAdmin(req: Request): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const phone = decoded.phone_number;
    if (!phone) { console.error("[admin] no phone_number in token"); return null; }
    const phones = getAdminPhones();
    if (!phones.includes(phone)) {
      console.error(`[admin] ${phone} not in admin list`);
      return null;
    }
    return decoded.uid;
  } catch (e) {
    console.error("[admin] verifyAdmin error:", e);
    return null;
  }
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
