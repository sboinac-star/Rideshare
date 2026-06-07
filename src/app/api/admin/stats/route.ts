import { adminDb, verifyAdmin, forbidden, adminCol,
} from "@/lib/adminFirebase";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  const [journeys, requests, chats, reports] = await Promise.all([
    db.collection(adminCol("journeys")).where("status", "==", "active").count().get(),
    db.collection(adminCol("requests")).where("status", "==", "active").count().get(),
    db.collection(adminCol("chats")).count().get(),
    db.collection(adminCol("reports")).where("resolved", "!=", true).count().get(),
  ]);

  return Response.json({
    activeJourneys: journeys.data().count,
    activeRequests: requests.data().count,
    totalChats: chats.data().count,
    pendingReports: reports.data().count,
  });
}
