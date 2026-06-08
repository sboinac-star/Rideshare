import { verifyUser } from "@/lib/adminFirebase";
import { notifyWatchers } from "@/app/api/watch/route";

export async function POST(req: Request) {
  const uid = await verifyUser(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { journeyId, route, message } = await req.json() as {
    journeyId: string;
    route: string;
    message: string;
  };

  if (!journeyId || !route || !message) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }

  await notifyWatchers(journeyId, route, message, uid);
  return Response.json({ ok: true });
}
