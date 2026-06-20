import { adminDb, adminAuth, verifyAdmin, forbidden, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();
  const auth = adminAuth();

  const [journeySnap, requestSnap, blockedSnap] = await Promise.all([
    db.collection("journeys").select("uid", "driverName", "status").get(),
    db.collection("requests").select("uid", "passengerName", "status").get(),
    db.collection("blockedPhones").get(),
  ]);

  const blockedPhones = new Set(blockedSnap.docs.map((d) => d.id));

  // Collect unique UIDs across all listings
  const uidSet = new Set<string>();
  for (const d of journeySnap.docs) { if (d.data().uid) uidSet.add(d.data().uid); }
  for (const d of requestSnap.docs) { if (d.data().uid) uidSet.add(d.data().uid); }

  // Look up phone numbers from Firebase Auth (server-side only — never stored in ride docs)
  const phoneByUid = new Map<string, string>();
  await Promise.all(
    Array.from(uidSet).map(async (uid) => {
      try {
        const u = await auth.getUser(uid);
        if (u.phoneNumber) phoneByUid.set(uid, u.phoneNumber);
      } catch {
        // user may have been deleted
      }
    })
  );

  const userMap = new Map<string, { phone: string; name: string; journeys: number; requests: number; blocked: boolean }>();

  for (const d of journeySnap.docs) {
    const { uid, driverName } = d.data();
    if (!uid) continue;
    const phone = phoneByUid.get(uid) ?? "";
    const existing = userMap.get(uid) ?? { phone, name: driverName, journeys: 0, requests: 0, blocked: blockedPhones.has(phone) };
    userMap.set(uid, { ...existing, journeys: existing.journeys + 1 });
  }
  for (const d of requestSnap.docs) {
    const { uid, passengerName } = d.data();
    if (!uid) continue;
    const phone = phoneByUid.get(uid) ?? "";
    const existing = userMap.get(uid) ?? { phone, name: passengerName, journeys: 0, requests: 0, blocked: blockedPhones.has(phone) };
    userMap.set(uid, { ...existing, requests: existing.requests + 1 });
  }

  return Response.json({ users: Array.from(userMap.entries()).map(([uid, u]) => ({ uid, ...u })) });
}

export async function POST(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const { phone, action } = await req.json() as { phone: string; action: "block" | "unblock" };
  if (!phone || !["block", "unblock"].includes(action)) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }

  const ref = adminDb().collection(adminCol("blockedPhones")).doc(phone);
  if (action === "block") {
    await ref.set({ blockedAt: FieldValue.serverTimestamp() });
  } else {
    await ref.delete();
  }

  return Response.json({ ok: true });
}
