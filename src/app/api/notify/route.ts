import { adminDb, adminMessaging, verifyUser, adminCol,
} from "@/lib/adminFirebase";

export async function POST(req: Request) {
  const senderUid = await verifyUser(req);
  if (!senderUid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId, text, senderName } = await req.json() as {
    chatId: string;
    text: string;
    senderName: string;
  };

  if (!chatId || !text) return Response.json({ ok: true });

  const db = adminDb();

  // Find the other participant
  const chatDoc = await db.collection(adminCol("chats")).doc(chatId).get();
  if (!chatDoc.exists) return Response.json({ ok: true });

  const participants: string[] = chatDoc.data()?.participants ?? [];
  const recipientUid = participants.find((p) => p !== senderUid);
  if (!recipientUid) return Response.json({ ok: true });

  // Get recipient's FCM token
  const tokenDoc = await db.collection(adminCol("fcmTokens")).doc(recipientUid).get();
  const fcmToken = tokenDoc.data()?.token as string | undefined;
  if (!fcmToken) return Response.json({ ok: true });

  try {
    await adminMessaging().send({
      token: fcmToken,
      notification: {
        title: senderName,
        body: text.length > 100 ? text.slice(0, 97) + "…" : text,
      },
      webpush: {
        fcmOptions: { link: "/messages" },
        notification: {
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: chatId,
        },
      },
    });
  } catch (e: unknown) {
    // Stale token — remove it so we don't keep trying
    const code = (e as { code?: string })?.code;
    if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
      await db.collection(adminCol("fcmTokens")).doc(recipientUid).delete();
    } else {
      console.error("[push] send error:", e);
    }
  }

  return Response.json({ ok: true });
}
