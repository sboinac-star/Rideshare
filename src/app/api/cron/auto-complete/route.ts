import { autoCompleteAndNudge } from "@/lib/autoComplete";

// Vercel Cron: runs daily at 2am UTC
// GET /api/cron/auto-complete?secret=CRON_SECRET
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = new URL(req.url).searchParams.get("secret");
  const cronHeader = req.headers.get("x-vercel-cron-signature");

  if ((!secret && !cronHeader) || (secret && provided !== secret && !cronHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const completed = await autoCompleteAndNudge();
  return Response.json({ ok: true, completed });
}
