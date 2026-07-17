import { adminDb, verifyUser, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const callerUid = await verifyUser(req);
  if (!callerUid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, listingType } = await req.json() as {
    listingId: string;
    listingType: "journey" | "request";
  };

  if (!listingId || !["journey", "request"].includes(listingType)) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }

  const db = adminDb();
  const collectionName = listingType === "journey" ? "journeys" : "requests";
  const listingRef = db.collection(adminCol(collectionName)).doc(listingId);
  const snap = await listingRef.get();

  if (!snap.exists) return Response.json({ error: "Not found" }, { status: 404 });

  const data = snap.data()!;
  if (data.uid !== callerUid) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (data.status === "completed") return Response.json({ error: "Already completed" }, { status: 409 });

  const profileRef = db.collection(adminCol("userProfiles")).doc(callerUid);

  await db.runTransaction(async (tx) => {
    tx.update(listingRef, { status: "completed" });
    tx.set(profileRef, { completedCount: FieldValue.increment(1) }, { merge: true });
  });

  return Response.json({ ok: true });
}
