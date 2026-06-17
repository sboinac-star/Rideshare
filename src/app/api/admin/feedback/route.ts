import { adminDb, adminCol, verifyAdmin, forbidden } from "@/lib/adminFirebase";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();
  const snap = await db.collection(adminCol("feedback")).orderBy("createdAt", "desc").limit(100).get();
  return Response.json({
    feedback: snap.docs.map((d) => ({
      id: d.id,
      text: d.data().text as string,
      uid: (d.data().uid as string | null) ?? null,
      createdAt: d.data().createdAt?.toDate()?.toISOString() ?? null,
    })),
  });
}

export async function DELETE(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const { id } = await req.json() as { id: string };
  const db = adminDb();
  await db.collection(adminCol("feedback")).doc(id).delete();
  return Response.json({ ok: true });
}
