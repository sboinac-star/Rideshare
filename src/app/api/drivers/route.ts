export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { db } = await import("@/lib/firebase-server");
    const {
      collection,
      addDoc,
      query,
      where,
      getDocs,
      updateDoc,
      doc,
      Timestamp,
    } = await import("firebase/firestore");

    const body = await req.json();
    const { userId, name, email, phone } = body;

    const driversCollection = collection(db, "drivers");
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
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to register driver" },
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

    const driversCollection = collection(db, "drivers");
    const q = query(driversCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const driver = querySnapshot.docs[0]
      ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
      : null;

    return NextResponse.json({ driver }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch driver" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { db } = await import("@/lib/firebase-server");
    const {
      doc,
      updateDoc,
    } = await import("firebase/firestore");

    const body = await req.json();
    const { driverId, status, rating, completedRides } = body;

    if (!driverId) {
      return NextResponse.json(
        { error: "driverId required" },
        { status: 400 }
      );
    }

    const driverRef = doc(db, "drivers", driverId);
    const updateData: any = {};

    if (status) updateData.status = status;
    if (rating) updateData.rating = rating;
    if (completedRides !== undefined)
      updateData.completedRides = completedRides;

    await updateDoc(driverRef, updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 }
    );
  }
}
