import { adminDb, verifyUser, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

const VALID_REASONS = [
  "Scam or fraud",
  "Fake listing",
  "Harassment",
  "No-show",
  "Unsafe behavior",
  "Other",
];

export async function POST(req: Request) {
  const reporterUid = await verifyUser(req);
  if (!reporterUid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, listingType, reason, details } = await req.json() as {
    listingId: string;
    listingType: "journey" | "request";
    reason: string;
    details?: string;
  };

  if (!listingId || !listingType || !VALID_REASONS.includes(reason)) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }

  const db = adminDb();

  // Prevent duplicate reports from same user for same listing
  const existing = await db.collection(adminCol("reports"))
    .where("reporterUid", "==", reporterUid)
    .where("journeyId", "==", listingId)
    .limit(1).get();

  if (!existing.empty) return Response.json({ error: "Already reported" }, { status: 409 });

  await db.collection(adminCol("reports")).add({
    reporterUid,
    journeyId: listingId,
    listingType,
    reason,
    details: details?.slice(0, 500) ?? "",
    resolved: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return Response.json({ ok: true });
}
