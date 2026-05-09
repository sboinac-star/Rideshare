export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateStringLength,
  validateNumber,
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

    // Rate limiting - 10 registrations per 15 minutes per IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`driver_registration_${clientIP}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    const { db } = await import("@/lib/firebase-server");
    const {
      collection,
      addDoc,
      query,
      where,
      getDocs,
      Timestamp,
    } = await import("firebase/firestore");

    const body = await req.json();

    // Validate required fields
    const userId = validateRequired(body.userId, 'User ID');
    const name = validateStringLength(body.name, 'Name', 2, 100);
    const email = validateEmail(body.email);
    const phone = validatePhone(body.phone);

    // Check if driver already exists
    const driversCollection = collection(db, "drivers");
    const existingQuery = query(driversCollection, where("userId", "==", userId));
    const existingDocs = await getDocs(existingQuery);

    if (!existingDocs.empty) {
      return NextResponse.json(
        { error: "Driver already registered" },
        { status: 409, headers: corsHeaders }
      );
    }

    const docRef = await addDoc(driversCollection, {
      userId,
      name,
      email,
      phone,
      status: "active",
      rating: 5.0,
      completedRides: 0,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json(
      { success: true, driverId: docRef.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }
    console.error('Driver registration error:', error);
    return NextResponse.json(
      { error: "Failed to register driver" },
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
    if (!checkRateLimit(`driver_get_${clientIP}`, 100, 15 * 60 * 1000)) {
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

    const driversCollection = collection(db, "drivers");
    const q = query(driversCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const driver = querySnapshot.docs[0]
      ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
      : null;

    return NextResponse.json({ driver }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Driver fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch driver" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Rate limiting - 50 updates per 15 minutes per IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`driver_update_${clientIP}`, 50, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many update attempts. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    const { db } = await import("@/lib/firebase-server");
    const {
      doc,
      updateDoc,
    } = await import("firebase/firestore");

    const body = await req.json();
    const driverId = validateRequired(body.driverId, 'Driver ID');

    // Validate driverId format
    if (typeof driverId !== 'string' || driverId.length < 1 || driverId.length > 100) {
      return NextResponse.json(
        { error: "Invalid driverId format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const updateData: any = {};

    if (body.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.status = body.status;
    }

    if (body.rating !== undefined) {
      updateData.rating = validateNumber(body.rating, 'Rating', 1, 5);
    }

    if (body.completedRides !== undefined) {
      updateData.completedRides = validateNumber(body.completedRides, 'Completed rides', 0);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400, headers: corsHeaders }
      );
    }

    const driverRef = doc(db, "drivers", driverId);
    await updateDoc(driverRef, updateData);

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }
    console.error('Driver update error:', error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500, headers: corsHeaders }
    );
  }
}
