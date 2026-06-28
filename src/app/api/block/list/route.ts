import { adminDb, adminCol, verifyUser, forbidden } from "@/lib/adminFirebase";

// GET /api/block/list → { uids: string[] }  (UIDs the current user has blocked)
export async function GET(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return forbidden();

  const db = adminDb();
  const snap = await db
    .collection(adminCol("blocks"))
    .where("blockerUid", "==", uid)
    .get();

  const uids = snap.docs.map((d) => d.data().blockedUid as string);
  return Response.json({ uids });
}
