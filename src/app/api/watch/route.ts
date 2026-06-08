import { adminDb, adminMessaging, verifyUser, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/watch?journeyId=xxx — check if current user is watching
export async function GET(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return Response.json({ watching: false });

  const { searchParams } = new URL(req.url);
  const journeyId = searchParams.get("journeyId");
  if (!journeyId) return Response.json({ watching: false });

  const db = adminDb();
  const snap = await db.collection(adminCol("rideWatches"))
    .where("uid", "==", uid)
    .where("journeyId", "==", journeyId)
    .limit(1)
    .get();

  return Response.json({ watching: !snap.empty });
}

// POST /api/watch — toggle watch on/off
export async function POST(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { journeyId, route } = await req.json() as { journeyId: string; route: string };
  if (!journeyId || !route) return Response.json({ error: "Invalid" }, { status: 400 });

  const db = adminDb();
  const col = adminCol("rideWatches");

  const existing = await db.collection(col)
    .where("uid", "==", uid)
    .where("journeyId", "==", journeyId)
    .limit(1)
    .get();

  if (!existing.empty) {
    await existing.docs[0].ref.delete();
    return Response.json({ watching: false });
  }

  await db.collection(col).add({
    uid,
    journeyId,
    route,
    createdAt: FieldValue.serverTimestamp(),
  });

  return Response.json({ watching: true });
}

// Called internally when a journey is cancelled or seats change
export async function notifyWatchers(
  journeyId: string,
  route: string,
  message: string,
  excludeUid?: string,
) {
  const db = adminDb();
  const messaging = adminMessaging();

  const watchSnap = await db.collection(adminCol("rideWatches"))
    .where("journeyId", "==", journeyId)
    .get();

  if (watchSnap.empty) return;

  await Promise.all(
    watchSnap.docs
      .filter((d) => d.data().uid !== excludeUid)
      .map(async (d) => {
        const watcherUid = d.data().uid as string;
        const tokenDoc = await db.collection(adminCol("fcmTokens")).doc(watcherUid).get();
        const token = tokenDoc.data()?.token as string | undefined;
        if (!token) return;
        try {
          await messaging.send({
            token,
            notification: { title: `🔔 Ride Update`, body: `${route}: ${message}` },
            webpush: {
              fcmOptions: { link: `/journey/${journeyId}` },
              notification: { icon: "/icon-192x192.png", badge: "/icon-192x192.png", tag: journeyId },
            },
          });
        } catch {
          // stale token — clean up
          await db.collection(adminCol("fcmTokens")).doc(watcherUid).delete();
        }
      })
  );

  // Clean up watches if cancelled
  if (message.includes("cancelled")) {
    await Promise.all(watchSnap.docs.map((d) => d.ref.delete()));
  }
}
