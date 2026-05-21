import { adminDb, verifyAdmin, forbidden } from "@/lib/adminFirebase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) return forbidden();
  const { id } = await params;
  const snap = await adminDb()
    .collection("chats").doc(id)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  const messages = snap.docs.map((d) => ({
    id: d.id,
    uid: d.data().uid,
    senderName: d.data().senderName,
    text: d.data().text,
    createdAt: d.data().createdAt?.toDate().toISOString() ?? null,
  }));

  return Response.json({ messages });
}
