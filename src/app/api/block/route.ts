import { adminDb, adminCol, verifyUser, forbidden } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/block?blockedUid=xxx  → { blocked: boolean }
export async function GET(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return forbidden();
  const { searchParams } = new URL(req.url);
  const blockedUid = searchParams.get("blockedUid");
  if (!blockedUid) return Response.json({ error: "Missing blockedUid" }, { status: 400 });

  const db = adminDb();
  const snap = await db.collection(adminCol("blocks")).doc(`${uid}_${blockedUid}`).get();
  return Response.json({ blocked: snap.exists });
}

// POST /api/block  body: { blockedUid }  → toggle block/unblock
export async function POST(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return forbidden();
  const { blockedUid } = await req.json() as { blockedUid: string };
  if (!blockedUid || blockedUid === uid)
    return Response.json({ error: "Invalid" }, { status: 400 });

  const db = adminDb();
  const ref = db.collection(adminCol("blocks")).doc(`${uid}_${blockedUid}`);
  const snap = await ref.get();

  if (snap.exists) {
    await ref.delete();
    return Response.json({ blocked: false });
  }

  await ref.set({ blockerUid: uid, blockedUid, createdAt: FieldValue.serverTimestamp() });
  return Response.json({ blocked: true });
}
