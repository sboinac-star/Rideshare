import { adminDb } from "@/lib/adminFirebase";
import { FieldValue } from "firebase-admin/firestore";

const col = (name: string) => `${process.env.NEXT_PUBLIC_COLLECTION_PREFIX ?? ""}${name}`;

export async function POST() {
  try {
    const db = adminDb();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ref = db.collection(col("pageViews")).doc(today);
    await ref.set({ hits: FieldValue.increment(1), date: today }, { merge: true });
  } catch {
    // fire-and-forget — never fail the user for analytics
  }
  return Response.json({ ok: true });
}
