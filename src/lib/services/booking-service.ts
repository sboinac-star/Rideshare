/**
 * Booking Service Layer
 * Handles all booking-related database operations
 */

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Booking, COLLECTIONS } from "../db";

/**
 * Create a new booking request
 */
export async function createBooking(
  db: Firestore,
  bookingData: Omit<Booking, "id" | "createdAt">
): Promise<{ id: string; booking: Booking }> {
  try {
    const bookingsCollection = collection(db, COLLECTIONS.BOOKINGS);
    const docRef = await addDoc(bookingsCollection, {
      ...bookingData,
      createdAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      booking: {
        id: docRef.id,
        ...bookingData,
        createdAt: Timestamp.now(),
      } as Booking,
    };
  } catch (error) {
    throw new Error(`Failed to create booking: ${error}`);
  }
}

/**
 * Get booking by ID
 */
export async function getBooking(
  db: Firestore,
  bookingId: string
): Promise<Booking | null> {
  try {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return null;
    }

    return {
      id: bookingDoc.id,
      ...bookingDoc.data(),
    } as Booking;
  } catch (error) {
    throw new Error(`Failed to get booking: ${error}`);
  }
}

/**
 * Get all bookings for a specific journey
 */
export async function getBookingsByJourney(
  db: Firestore,
  journeyId: string
): Promise<Booking[]> {
  try {
    const bookingsCollection = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(
      bookingsCollection,
      where("journeyId", "==", journeyId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];
  } catch (error) {
    throw new Error(`Failed to get bookings by journey: ${error}`);
  }
}

/**
 * Get all bookings by a specific passenger
 */
export async function getBookingsByPassenger(
  db: Firestore,
  passengerId: string
): Promise<Booking[]> {
  try {
    const bookingsCollection = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(
      bookingsCollection,
      where("passengerId", "==", passengerId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];
  } catch (error) {
    throw new Error(`Failed to get bookings by passenger: ${error}`);
  }
}

/**
 * Get pending bookings for a driver
 */
export async function getPendingBookingsForDriver(
  db: Firestore,
  driverId: string
): Promise<Booking[]> {
  try {
    const bookingsCollection = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(
      bookingsCollection,
      where("driverId", "==", driverId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];
  } catch (error) {
    throw new Error(`Failed to get pending bookings for driver: ${error}`);
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  db: Firestore,
  bookingId: string,
  status: Booking["status"],
  driverMessage?: string
): Promise<void> {
  try {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    const updateData: any = {
      status,
      respondedAt: Timestamp.now(),
    };

    if (driverMessage) {
      updateData.driverMessage = driverMessage;
    }

    await updateDoc(bookingRef, updateData);
  } catch (error) {
    throw new Error(`Failed to update booking status: ${error}`);
  }
}

/**
 * Accept booking request
 */
export async function acceptBooking(
  db: Firestore,
  bookingId: string,
  driverMessage?: string
): Promise<void> {
  try {
    await updateBookingStatus(db, bookingId, "accepted", driverMessage);
  } catch (error) {
    throw new Error(`Failed to accept booking: ${error}`);
  }
}

/**
 * Reject booking request
 */
export async function rejectBooking(
  db: Firestore,
  bookingId: string,
  driverMessage?: string
): Promise<void> {
  try {
    await updateBookingStatus(db, bookingId, "rejected", driverMessage);
  } catch (error) {
    throw new Error(`Failed to reject booking: ${error}`);
  }
}

/**
 * Cancel booking request
 */
export async function cancelBooking(
  db: Firestore,
  bookingId: string
): Promise<void> {
  try {
    await updateBookingStatus(db, bookingId, "cancelled");
  } catch (error) {
    throw new Error(`Failed to cancel booking: ${error}`);
  }
}

/**
 * Delete booking
 */
export async function deleteBooking(db: Firestore, bookingId: string): Promise<void> {
  try {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    await deleteDoc(bookingRef);
  } catch (error) {
    throw new Error(`Failed to delete booking: ${error}`);
  }
}
