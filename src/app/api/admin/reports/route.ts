import { adminDb, verifyAdmin, forbidden, adminCol,
} from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  const snap = await db.collection(adminCol("reports")).orderBy("createdAt", "desc").limit(100).get();
  const reports = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data();
      let listing = null;
      try {
        const jSnap = await db.collection(adminCol("journeys")).doc(data.journeyId).get();
        if (jSnap.exists) listing = { id: jSnap.id, type: "journey", ...jSnap.data() };
        else {
          const rSnap = await db.collection(adminCol("requests")).doc(data.journeyId).get();
          if (rSnap.exists) listing = { id: rSnap.id, type: "request", ...rSnap.data() };
        }
      } catch { /* listing deleted */ }
      return { id: d.id, ...data, listing };
    })
  );

  return Response.json({ reports });
}

export async function PATCH(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const { id, deleteListing } = await req.json() as { id: string; deleteListing?: { collection: string; docId: string } };
  const db = adminDb();

  await db.collection(adminCol("reports")).doc(id).update({ resolved: true, resolvedAt: FieldValue.serverTimestamp() });

  if (deleteListing) {
    await db.collection(deleteListing.collection).doc(deleteListing.docId).delete();
  }

  return Response.json({ ok: true });
}
