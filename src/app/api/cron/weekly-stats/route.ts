import { adminDb, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

// Vercel Cron: runs weekly (configured in vercel.json)
// Also callable manually: GET /api/cron/weekly-stats?secret=CRON_SECRET
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = new URL(req.url).searchParams.get("secret");
  const cronHeader = req.headers.get("x-vercel-cron-signature");

  if (secret && provided !== secret && !cronHeader) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [journeys, requests, chats, newJourneys, newRequests] = await Promise.all([
    db.collection(adminCol("journeys")).where("status", "==", "active").count().get(),
    db.collection(adminCol("requests")).where("status", "==", "active").count().get(),
    db.collection(adminCol("chats")).count().get(),
    db.collection(adminCol("journeys")).where("createdAt", ">=", oneWeekAgo).count().get(),
    db.collection(adminCol("requests")).where("createdAt", ">=", oneWeekAgo).count().get(),
  ]);

  const stats = {
    activeJourneys: journeys.data().count,
    activeRequests: requests.data().count,
    totalChats: chats.data().count,
    newJourneysThisWeek: newJourneys.data().count,
    newRequestsThisWeek: newRequests.data().count,
    generatedAt: new Date().toISOString(),
  };

  // Persist stats snapshot to Firestore
  await db.collection(adminCol("weeklyStats")).add({
    ...stats,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Send email if Resend API key is configured
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (resendKey && adminEmail) {
    await sendEmail(resendKey, adminEmail, stats);
  }

  return Response.json({ ok: true, stats });
}

async function sendEmail(
  apiKey: string,
  to: string,
  stats: {
    activeJourneys: number;
    activeRequests: number;
    totalChats: number;
    newJourneysThisWeek: number;
    newRequestsThisWeek: number;
    generatedAt: string;
  }
) {
  const html = `
    <h2>NWA Ride Share — Weekly Stats</h2>
    <p>Week ending ${new Date(stats.generatedAt).toDateString()}</p>
    <table style="border-collapse:collapse;font-family:sans-serif">
      <tr><td style="padding:8px 16px 8px 0;color:#6b7280">Active journeys</td><td style="padding:8px 0;font-weight:bold">${stats.activeJourneys}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;color:#6b7280">Active ride requests</td><td style="padding:8px 0;font-weight:bold">${stats.activeRequests}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;color:#6b7280">Total chats</td><td style="padding:8px 0;font-weight:bold">${stats.totalChats}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;color:#6b7280">New journeys this week</td><td style="padding:8px 0;font-weight:bold;color:#16a34a">+${stats.newJourneysThisWeek}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;color:#6b7280">New requests this week</td><td style="padding:8px 0;font-weight:bold;color:#16a34a">+${stats.newRequestsThisWeek}</td></tr>
    </table>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Sent automatically by NWA Ride Share</p>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "NWA Ride Share <stats@nwa-rideshare.vercel.app>",
      to,
      subject: `NWA Ride Share Weekly Stats — ${new Date().toDateString()}`,
      html,
    }),
  });
}
