import { adminDb, adminMessaging, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

function advanceTime(dt: string, mode: "weekly" | "weekdays"): string {
  const d = new Date(dt);
  if (mode === "weekly") {
    d.setDate(d.getDate() + 7);
  } else {
    // next weekday: skip Sat/Sun
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addHoursLocal(dt: string, hours: number): string {
  const d = new Date(dt);
  d.setMinutes(d.getMinutes() + hours * 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Re-post recurring journeys whose departureTime has passed
export async function repostRecurring() {
  const db = adminDb();
  const now = new Date().toISOString();
  let count = 0;

  for (const colName of ["journeys", "requests"] as const) {
    const snap = await db
      .collection(adminCol(colName))
      .where("status", "==", "active")
      .where("departureTime", "<", now)
      .get();

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const recurring = data.recurring as string | undefined;
      if (!recurring || recurring === "none") continue;

      const nextDeparture = advanceTime(data.departureTime as string, recurring as "weekly" | "weekdays");
      const bufferHours = (data.bufferHours as number | undefined) ?? 0;

      // Build the new doc — advance returnTime by the same interval if present
      const returnRecurring = data.returnRecurring as string | undefined;
      const newDoc: Record<string, unknown> = {
        ...data,
        departureTime: nextDeparture,
        endTime: bufferHours ? addHoursLocal(nextDeparture, bufferHours) : null,
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
      };

      if (data.returnTime && returnRecurring && returnRecurring !== "none") {
        const nextReturn = advanceTime(data.returnTime as string, returnRecurring as "weekly" | "weekdays");
        const returnBufferHours = (data.returnBufferHours as number | undefined) ?? 0;
        newDoc.returnTime = nextReturn;
        newDoc.returnEndTime = returnBufferHours ? addHoursLocal(nextReturn, returnBufferHours) : null;
      }

      await db.collection(adminCol(colName)).add(newDoc);

      // Mark the old one completed so it doesn't show in active listings
      await docSnap.ref.update({ status: "completed", completedAt: FieldValue.serverTimestamp() });
      count++;
    }
  }

  return count;
}

// Shared logic: find past active rides, mark completed, send nudge push to driver
export async function autoCompleteAndNudge() {
  const db = adminDb();
  const now = new Date().toISOString();
  const batch = db.batch();
  let batchSize = 0;
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
      batchSize++;

      const data = docSnap.data();
      const uid = data.uid as string | undefined;
      const from = data.from as string | undefined;
      const to = data.to as string | undefined;
      if (uid && from && to) {
        nudgeTargets.push({ uid, route: `${from} → ${to}`, journeyId: docSnap.id });
      }
    }
  }

  if (batchSize > 0) await batch.commit();

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
