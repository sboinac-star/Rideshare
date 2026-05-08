export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { db } = await import("@/lib/firebase-server");
    const {
      collection,
      addDoc,
      Timestamp,
    } = await import("firebase/firestore");

    const body = await req.json();
    const {
      userId,
      pickup,
      dropoff,
      rideType,
      date,
      passengers,
      estimatedPrice,
    } = body;

    const ridesCollection = collection(db, "rides");
    const docRef = await addDoc(ridesCollection, {
      userId,
      pickup,
      dropoff,
      rideType,
      date: Timestamp.fromDate(new Date(date)),
      passengers,
      estimatedPrice,
      status: "requested",
      createdAt: Timestamp.now(),
      acceptedDriver: null,
    });

    return NextResponse.json(
      { success: true, rideId: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create ride request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
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
        { error: "userId required" },
        { status: 400 }
      );
    }

    const ridesCollection = collection(db, "rides");
    const q = query(ridesCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const rides = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ rides }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch rides" },
      { status: 500 }
    );
  }
}
