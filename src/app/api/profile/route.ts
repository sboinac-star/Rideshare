import { adminDb, verifyUser, adminCol } from "@/lib/adminFirebase";

const ALLOWED_DOMAINS = ["facebook.com", "fb.com", "linkedin.com", "instagram.com", "twitter.com", "x.com"];

function isValidSocialUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = adminDb();
  const snap = await db.collection(adminCol("userProfiles")).doc(uid).get();
  const data = snap.data() ?? {};
  return Response.json({
    socialUrl: data.socialUrl ?? "",
    completedCount: data.completedCount ?? 0,
    cancelCount: data.cancelCount ?? 0,
  });
}

export async function POST(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { socialUrl } = await req.json() as { socialUrl: string };

  if (socialUrl && !isValidSocialUrl(socialUrl)) {
    return Response.json({ error: "Only Facebook, LinkedIn, Instagram, or X/Twitter URLs are allowed." }, { status: 400 });
  }

  const db = adminDb();
  await db.collection(adminCol("userProfiles")).doc(uid).set(
    { socialUrl: socialUrl.trim() },
    { merge: true }
  );

  return Response.json({ ok: true });
}
