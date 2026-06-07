import { adminDb, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

// Vercel Cron: runs daily at 2am UTC to auto-complete past rides
// GET /api/cron/auto-complete?secret=CRON_SECRET
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = new URL(req.url).searchParams.get("secret");
  const cronHeader = req.headers.get("x-vercel-cron-signature");

  if (secret && provided !== secret && !cronHeader) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const now = new Date().toISOString();
  const batch = db.batch();
  let count = 0;

  for (const colName of ["journeys", "requests"] as const) {
    const snap = await db
      .collection(adminCol(colName))
      .where("status", "==", "active")
      .where("departureTime", "<", now)
      .get();

    for (const docSnap of snap.docs) {
      batch.update(docSnap.ref, {
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });
      count++;
    }
  }

  if (count > 0) await batch.commit();

  return Response.json({ ok: true, completed: count });
}
