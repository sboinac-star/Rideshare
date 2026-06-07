import { adminDb, adminMessaging, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

// Shared logic: find past active rides, mark completed, send nudge push to driver
export async function autoCompleteAndNudge() {
  const db = adminDb();
  const now = new Date().toISOString();
  const batch = db.batch();
  const nudgeTargets: { uid: string; route: string; journeyId: string }[] = [];

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

      const data = docSnap.data();
      const uid = data.uid as string | undefined;
      const from = data.from as string | undefined;
      const to = data.to as string | undefined;
      if (uid && from && to) {
        nudgeTargets.push({ uid, route: `${from} → ${to}`, journeyId: docSnap.id });
      }
    }
  }

  if (nudgeTargets.length > 0) await batch.commit();

  // Send nudge push to each driver — fire and forget, don't block
  await Promise.allSettled(
    nudgeTargets.map(async ({ uid, route }) => {
      const tokenDoc = await db.collection(adminCol("fcmTokens")).doc(uid).get();
      const fcmToken = tokenDoc.data()?.token as string | undefined;
      if (!fcmToken) return;

      try {
        await adminMessaging().send({
          token: fcmToken,
          notification: {
            title: "Ride completed!",
            body: `${route} is done. Post your next ride to keep the momentum going.`,
          },
          webpush: {
            fcmOptions: { link: "/driver" },
            notification: {
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
              tag: `nudge-${uid}`,
            },
          },
        });
      } catch (e: unknown) {
        const code = (e as { code?: string })?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          await db.collection(adminCol("fcmTokens")).doc(uid).delete();
        }
      }
    })
  );

  return nudgeTargets.length;
}
