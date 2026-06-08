import { adminDb, verifyAdmin, forbidden, adminCol } from "@/lib/adminFirebase";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  // Current snapshot counts
  const [journeys, requests, chats, reports] = await Promise.all([
    db.collection(adminCol("journeys")).where("status", "==", "active").count().get(),
    db.collection(adminCol("requests")).where("status", "==", "active").count().get(),
    db.collection(adminCol("chats")).count().get(),
    db.collection(adminCol("reports")).where("resolved", "!=", true).count().get(),
  ]);

  // Daily counts for last 14 days
  const days = 14;
  const dailyCounts: { date: string; journeys: number; requests: number; chats: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [j, r, c] = await Promise.all([
      db.collection(adminCol("journeys")).where("createdAt", ">=", start).where("createdAt", "<", end).count().get(),
      db.collection(adminCol("requests")).where("createdAt", ">=", start).where("createdAt", "<", end).count().get(),
      db.collection(adminCol("chats")).where("updatedAt", ">=", start).where("updatedAt", "<", end).count().get(),
    ]);

    dailyCounts.push({
      date: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      journeys: j.data().count,
      requests: r.data().count,
      chats: c.data().count,
    });
  }

  // Repeat users: users with 2+ journey/request docs
  const [allJourneys, allRequests] = await Promise.all([
    db.collection(adminCol("journeys")).select("uid").get(),
    db.collection(adminCol("requests")).select("uid").get(),
  ]);

  const uidCounts = new Map<string, number>();
  for (const d of [...allJourneys.docs, ...allRequests.docs]) {
    const uid = d.data().uid as string | undefined;
    if (uid) uidCounts.set(uid, (uidCounts.get(uid) ?? 0) + 1);
  }

  const totalUsers = uidCounts.size;
  const repeatUsers = [...uidCounts.values()].filter((n) => n >= 2).length;
  const oneTimeUsers = totalUsers - repeatUsers;

  return Response.json({
    activeJourneys: journeys.data().count,
    activeRequests: requests.data().count,
    totalChats: chats.data().count,
    pendingReports: reports.data().count,
    dailyCounts,
    repeatUsers,
    oneTimeUsers,
    totalUsers,
  });
}
