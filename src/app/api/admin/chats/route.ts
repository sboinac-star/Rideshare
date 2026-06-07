import { adminDb, verifyAdmin, forbidden, adminCol,
} from "@/lib/adminFirebase";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  const snap = await db.collection(adminCol("chats")).orderBy("updatedAt", "desc").limit(100).get();
  const chats = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      participants: data.participants,
      participantNames: data.participantNames,
      listingType: data.listingType,
      listingId: data.listingId,
      route: data.route,
      lastMessage: data.lastMessage,
      updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
    };
  });

  return Response.json({ chats });
}
