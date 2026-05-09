export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  validateRequired,
  validateStringLength,
  ValidationError,
  checkRateLimit,
  handleCors,
  corsHeaders,
  sanitizeHtml,
} from "@/lib/validation";

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Rate limiting - 50 messages per 15 minutes per IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`message_post_${clientIP}`, 50, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    const { db } = await import("@/lib/firebase-server");
    const {
      collection,
      addDoc,
      query,
      where,
      orderBy,
      getDocs,
      Timestamp,
    } = await import("firebase/firestore");

    const body = await req.json();

    // Validate required fields
    const senderId = validateRequired(body.senderId, 'Sender ID');
    const receiverId = validateRequired(body.receiverId, 'Receiver ID');
    const journeyId = validateRequired(body.journeyId, 'Journey ID');

    let content = validateRequired(body.content, 'Message content');
    content = validateStringLength(content, 'Message content', 1, 1000);

    // Sanitize HTML and potentially harmful content
    content = sanitizeHtml(content);

    // Prevent users from messaging themselves
    if (senderId === receiverId) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify journey exists and get participants
    const journeysCollection = collection(db, "journeys");
    const journeyQuery = query(journeysCollection, where("__name__", "==", journeyId));
    const journeySnapshot = await getDocs(journeyQuery);

    if (journeySnapshot.empty) {
      return NextResponse.json(
        { error: "Journey not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const journey = journeySnapshot.docs[0].data();
    const validParticipants = [journey.driverId];

    // Check if sender and receiver are valid participants
    if (!validParticipants.includes(senderId)) {
      return NextResponse.json(
        { error: "Unauthorized to send messages for this journey" },
        { status: 403, headers: corsHeaders }
      );
    }

    // For now, allow any receiver (could be expanded for passenger lists later)
    // This is simplified for the current BlaBlaCar model

    const messagesCollection = collection(db, "messages");
    const docRef = await addDoc(messagesCollection, {
      senderId,
      receiverId,
      journeyId,
      content,
      timestamp: Timestamp.now(),
      read: false,
    });

    return NextResponse.json(
      { success: true, messageId: docRef.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }
    console.error('Message creation error:', error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Rate limiting - 100 requests per 15 minutes per IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`message_get_${clientIP}`, 100, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    const { db } = await import("@/lib/firebase-server");
    const {
      collection,
      query,
      where,
      orderBy,
      getDocs,
    } = await import("firebase/firestore");

    const userId = req.nextUrl.searchParams.get("userId");
    const journeyId = req.nextUrl.searchParams.get("journeyId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const messagesCollection = collection(db, "messages");
    let q = query(messagesCollection, orderBy("timestamp", "asc"));

    // Filter by user participation and optionally by journey
    q = query(q, where("senderId", "==", userId));
    // Note: In a real app, you'd want to index both sender and receiver
    // For now, this is simplified

    if (journeyId) {
      q = query(q, where("journeyId", "==", journeyId));
    }

    const querySnapshot = await getDocs(q);

    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ messages }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Message fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500, headers: corsHeaders }
    );
  }
}