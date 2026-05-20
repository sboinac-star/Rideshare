import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId: string = typeof body.userId === "string" && body.userId ? body.userId : "test-user-preview";

    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? "{}");
    // Vercel sometimes stores the private key with escaped newlines — unescape them
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    const adminApp =
      getApps().find((a) => a.name === "test-auth") ??
      initializeApp({ credential: cert(serviceAccount) }, "test-auth");

    const token = await getAuth(adminApp).createCustomToken(userId);
    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
