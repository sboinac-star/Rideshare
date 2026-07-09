import { adminDb, verifyUser, adminCol } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/ratings — submit a rating
export async function POST(req: Request) {
  const raterUid = await verifyUser(req);
  if (!raterUid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { ratedUid, journeyId, score, comment } = await req.json() as {
    ratedUid: string;
    journeyId: string;
    score: number;
    comment?: string;
  };

  if (!ratedUid || !journeyId || typeof score !== "number" || score < 1 || score > 5) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  if (raterUid === ratedUid) return Response.json({ error: "Cannot rate yourself" }, { status: 400 });

  const db = adminDb();
  const col = adminCol("ratings");

  // One rating per rater per journey
  const existing = await db.collection(col)
    .where("raterUid", "==", raterUid)
    .where("journeyId", "==", journeyId)
    .limit(1).get();

  if (!existing.empty) return Response.json({ error: "Already rated" }, { status: 409 });

  await db.collection(col).add({
    raterUid,
    ratedUid,
    journeyId,
    score,
    comment: comment?.slice(0, 200) ?? "",
    createdAt: FieldValue.serverTimestamp(),
  });

  // Update aggregate on user's profile
  const profileRef = db.collection(adminCol("userProfiles")).doc(ratedUid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(profileRef);
    const prev = snap.data() ?? { ratingSum: 0, ratingCount: 0 };
    tx.set(profileRef, {
      ratingSum: (prev.ratingSum ?? 0) + score,
      ratingCount: (prev.ratingCount ?? 0) + 1,
    }, { merge: true });
  });

  return Response.json({ ok: true });
}

// GET /api/ratings?uid=xxx — get aggregate rating for a user
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  if (!uid) return Response.json({ rating: null, count: 0 });

  const db = adminDb();
  const snap = await db.collection(adminCol("userProfiles")).doc(uid).get();
  if (!snap.exists) return Response.json({ rating: null, count: 0 });

  const { ratingSum, ratingCount, cancelCount, completedCount } = snap.data() as { ratingSum: number; ratingCount: number; cancelCount?: number; completedCount?: number };
  const rating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null;
  return Response.json({ rating, count: ratingCount, cancelCount: cancelCount ?? 0, completedCount: completedCount ?? 0 });
}
