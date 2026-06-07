import { adminDb, verifyAdmin, forbidden, adminCol,
} from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  const [journeySnap, requestSnap, blockedSnap] = await Promise.all([
    db.collection(adminCol("journeys")).select("uid", "driverPhone", "driverName", "status").get(),
    db.collection(adminCol("requests")).select("uid", "passengerPhone", "passengerName", "status").get(),
    db.collection(adminCol("blockedPhones")).get(),
  ]);

  const blockedPhones = new Set(blockedSnap.docs.map((d) => d.id));
  const userMap = new Map<string, { phone: string; name: string; journeys: number; requests: number; blocked: boolean }>();

  for (const d of journeySnap.docs) {
    const { uid, driverPhone, driverName } = d.data();
    if (!uid) continue;
    const existing = userMap.get(uid) ?? { phone: driverPhone, name: driverName, journeys: 0, requests: 0, blocked: blockedPhones.has(driverPhone) };
    userMap.set(uid, { ...existing, journeys: existing.journeys + 1 });
  }
  for (const d of requestSnap.docs) {
    const { uid, passengerPhone, passengerName } = d.data();
    if (!uid) continue;
    const existing = userMap.get(uid) ?? { phone: passengerPhone, name: passengerName, journeys: 0, requests: 0, blocked: blockedPhones.has(passengerPhone) };
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
