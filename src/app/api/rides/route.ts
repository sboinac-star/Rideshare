export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  validateRequired,
  validateStringLength,
  validateNumber,
  validateDate,
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

    // Rate limiting - 20 ride requests per 15 minutes per IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`ride_request_${clientIP}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many ride requests. Please try again later." },
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
    const userId = validateRequired(body.userId, 'User ID');
    const pickup = validateStringLength(body.pickup, 'Pickup location', 3, 200);
    const dropoff = validateStringLength(body.dropoff, 'Dropoff location', 3, 200);
    const rideType = validateRequired(body.rideType, 'Ride type');

    // Validate ride type
    const validRideTypes = ['one-way', 'round-trip', 'hourly'];
    if (!validRideTypes.includes(rideType)) {
      return NextResponse.json(
        { error: "Invalid ride type" },
        { status: 400, headers: corsHeaders }
      );
    }

    const date = validateDate(body.date, 'Ride date');
    const passengers = validateNumber(body.passengers, 'Passengers', 1, 8);

    // Optional estimated price validation
    let estimatedPrice = null;
    if (body.estimatedPrice !== undefined) {
      estimatedPrice = validateNumber(body.estimatedPrice, 'Estimated price', 0, 10000);
    }

    const ridesCollection = collection(db, "rides");
    const docRef = await addDoc(ridesCollection, {
      userId,
      pickup,
      dropoff,
      rideType,
      date: Timestamp.fromDate(date),
      passengers,
      estimatedPrice,
      status: "requested",
      createdAt: Timestamp.now(),
      acceptedDriver: null,
    });

    return NextResponse.json(
      { success: true, rideId: docRef.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }
    console.error('Ride creation error:', error);
    return NextResponse.json(
      { error: "Failed to create ride request" },
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
    if (!checkRateLimit(`ride_get_${clientIP}`, 100, 15 * 60 * 1000)) {
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
      getDocs,
    } = await import("firebase/firestore");

    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic userId validation
    if (typeof userId !== 'string' || userId.length < 1 || userId.length > 100) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const ridesCollection = collection(db, "rides");
    const q = query(ridesCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const rides = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ rides }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Ride fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch rides" },
      { status: 500, headers: corsHeaders }
    );
  }
}
