import { adminDb, verifyAdmin, forbidden } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const snap = await adminDb().collection("announcements").orderBy("createdAt", "desc").get();
  const announcements = snap.docs.map((d) => ({
    id: d.id,
    text: d.data().text,
    createdAt: d.data().createdAt?.toDate().toISOString() ?? null,
  }));
  return Response.json({ announcements });
}

export async function POST(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return Response.json({ error: "Text required" }, { status: 400 });
  const ref = await adminDb().collection("announcements").add({
    text: text.trim(),
    createdAt: FieldValue.serverTimestamp(),
  });
  return Response.json({ id: ref.id });
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin(req)) return forbidden();
  const { id } = await req.json() as { id: string };
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });
  await adminDb().collection("announcements").doc(id).delete();
  return Response.json({ ok: true });
}
