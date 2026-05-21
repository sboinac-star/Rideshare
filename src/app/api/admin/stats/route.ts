import { adminDb, verifyAdmin, forbidden } from "@/lib/adminFirebase";

export async function GET(req: Request) {
  if (!await verifyAdmin(req)) return forbidden();
  const db = adminDb();

  const [journeys, requests, chats, reports] = await Promise.all([
    db.collection("journeys").where("status", "==", "active").count().get(),
    db.collection("requests").where("status", "==", "active").count().get(),
    db.collection("chats").count().get(),
    db.collection("reports").where("resolved", "!=", true).count().get(),
  ]);

  return Response.json({
    activeJourneys: journeys.data().count,
    activeRequests: requests.data().count,
    totalChats: chats.data().count,
    pendingReports: reports.data().count,
  });
}
