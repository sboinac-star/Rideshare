// TEMPORARY debug endpoint — remove after fixing admin auth
export async function GET(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ step: "no token" }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
  const adminPhonesRaw = process.env.ADMIN_PHONES ?? "";

  let lookupStatus = 0;
  let phoneNumber = "";
  let lookupError = "";

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) }
    );
    lookupStatus = res.status;
    const data = await res.json() as { users?: { phoneNumber?: string }[]; error?: { message: string } };
    phoneNumber = data.users?.[0]?.phoneNumber ?? "";
    if (data.error) lookupError = data.error.message;
  } catch (e) {
    lookupError = String(e);
  }

  const adminPhones = adminPhonesRaw.split(",").map((p) => p.trim()).filter(Boolean);
  const isMatch = adminPhones.includes(phoneNumber);

  return Response.json({
    hasApiKey: apiKey.length > 0,
    lookupHttpStatus: lookupStatus,
    lookupError,
    phoneLast4: phoneNumber.slice(-4),
    adminPhonesCount: adminPhones.length,
    adminPhonesLast4s: adminPhones.map((p) => p.slice(-4)),
    isMatch,
  });
}
