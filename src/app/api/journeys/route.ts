export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  validateRequired,
  validateStringLength,
  validateNumber,
  validateDate,
  validatePhone,
  ValidationError,
  checkRateLimit,
  handleCors,
  corsHeaders,
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

    // Rate limiting - 10 journey posts per 15 minutes per IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`journey_post_${clientIP}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many journey posts. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    const { db } = await import("@/lib/firebase-server");
    const {
      collection,
      addDoc,
      Timestamp,
    } = await import("firebase/firestore");

    const body = await req.json();

    // Validate required fields
    const driverId = validateRequired(body.driverId, 'Driver ID');
    const from = validateStringLength(body.from, 'From location', 2, 100);
    const to = validateStringLength(body.to, 'To location', 2, 100);
    const driverPhone = validatePhone(body.driverPhone);
    const seats = validateNumber(body.seats, 'Available seats', 1, 8);
    const date = validateDate(body.date, 'Journey date');

    // Optional fields
    const tripType = body.tripType || 'one-way';
    const validTripTypes = ['one-way', 'round-trip'];
    if (!validTripTypes.includes(tripType)) {
      return NextResponse.json(
        { error: "Invalid trip type" },
        { status: 400, headers: corsHeaders }
      );
    }

    const journeysCollection = collection(db, "journeys");
    const docRef = await addDoc(journeysCollection, {
      driverId,
      from,
      to,
      driverPhone,
      seats,
      date: Timestamp.fromDate(date),
      tripType,
      status: "active",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json(
      { success: true, journeyId: docRef.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }
    console.error('Journey creation error:', error);
    return NextResponse.json(
      { error: "Failed to create journey" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Rate limiting - 200 requests per 15 minutes per IP (higher for browsing)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`journey_get_${clientIP}`, 200, 15 * 60 * 1000)) {
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

    const journeysCollection = collection(db, "journeys");

    // Optional filtering
    let q = query(journeysCollection, orderBy("createdAt", "desc"));

    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const driverId = req.nextUrl.searchParams.get("driverId");

    if (from) {
      q = query(q, where("from", "==", from));
    }
    if (to) {
      q = query(q, where("to", "==", to));
    }
    if (driverId) {
      q = query(q, where("driverId", "==", driverId));
    }

    const querySnapshot = await getDocs(q);

    const journeys = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ journeys }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Journey fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch journeys" },
      { status: 500, headers: corsHeaders }
    );
  }
}