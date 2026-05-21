import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  const existing = getApps().find((a) => a.name === "admin");
  if (existing) return existing;
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? "{}");
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(sa) }, "admin");
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
    const phones = getAdminPhones();
    if (!decoded.phone_number || !phones.includes(decoded.phone_number)) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
