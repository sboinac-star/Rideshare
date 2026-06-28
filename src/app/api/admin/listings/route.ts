import { adminDb, verifyAdmin, forbidden, adminCol,
} from "@/lib/adminFirebase";
import { NextRequest } from "next/server";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  const [journeySnap, requestSnap] = await Promise.all([
    db.collection(adminCol("journeys")).orderBy("departureTime", "desc").limit(200).get(),
    db.collection(adminCol("requests")).orderBy("departureTime", "desc").limit(200).get(),
  ]);

  const journeys = journeySnap.docs.map((d) => ({ id: d.id, type: "journey", ...d.data() }));
  const requests = requestSnap.docs.map((d) => ({ id: d.id, type: "request", ...d.data() }));

  return Response.json({ journeys, requests });
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin(req)) return forbidden();
  const { collection, id } = await req.json() as { collection: string; id: string };
  if (!["journeys", "requests"].includes(collection) || !id) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await adminDb().collection(collection).doc(id).delete();
  return Response.json({ ok: true });
}
