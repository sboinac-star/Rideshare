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
    // Use Firebase REST API — no service account needed for token verification
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) }
    );
    if (!res.ok) { console.error("[admin] token lookup HTTP", res.status); return null; }
    const data = await res.json() as { users?: { localId: string; phoneNumber?: string }[] };
    const user = data.users?.[0];
    if (!user?.phoneNumber) { console.error("[admin] no phoneNumber in token"); return null; }
    const phones = getAdminPhones();
    if (!phones.includes(user.phoneNumber)) {
      console.error(`[admin] ${user.phoneNumber} not in list [${phones.join(",")}]`);
      return null;
    }
    return user.localId;
  } catch (e) {
    console.error("[admin] verifyAdmin error:", e);
    return null;
  }
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
