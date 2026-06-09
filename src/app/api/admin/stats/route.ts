import { adminDb, verifyAdmin, forbidden } from "@/lib/adminFirebase";

const col = (name: string) => `${process.env.NEXT_PUBLIC_COLLECTION_PREFIX ?? ""}${name}`;

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  // Current snapshot counts
  const [journeys, requests, chats, reports] = await Promise.all([
    db.collection(col("journeys")).where("status", "==", "active").count().get(),
    db.collection(col("requests")).where("status", "==", "active").count().get(),
    db.collection(col("chats")).count().get(),
    db.collection(col("reports")).where("resolved", "!=", true).count().get(),
  ]);

  // Daily counts for last 14 days
  const days = 14;
  const dailyCounts: { date: string; journeys: number; requests: number; chats: number; pageViews: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const isoDate = start.toISOString().slice(0, 10);

    const [j, r, c, pv] = await Promise.all([
      db.collection(col("journeys")).where("createdAt", ">=", start).where("createdAt", "<", end).count().get(),
      db.collection(col("requests")).where("createdAt", ">=", start).where("createdAt", "<", end).count().get(),
      db.collection(col("chats")).where("updatedAt", ">=", start).where("updatedAt", "<", end).count().get(),
      db.collection(col("pageViews")).doc(isoDate).get(),
    ]);

    dailyCounts.push({
      date: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      journeys: j.data().count,
      requests: r.data().count,
      chats: c.data().count,
      pageViews: (pv.data()?.hits as number) ?? 0,
    });
  }

  // Repeat users: users with 2+ journey/request docs
  const [allJourneys, allRequests] = await Promise.all([
    db.collection(col("journeys")).select("uid").get(),
    db.collection(col("requests")).select("uid").get(),
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
