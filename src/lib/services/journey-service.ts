/**
 * Journey Service Layer
 * Handles all journey-related database operations
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
  limit,
  startAfter,
  Timestamp,
  increment,
} from "firebase/firestore";
import { Journey, COLLECTIONS } from "../db";

/**
 * Create a new journey posted by a driver
 */
export async function createJourney(
  db: Firestore,
  journeyData: Omit<Journey, "id" | "createdAt" | "bookedSeats" | "acceptedPassengers">
): Promise<{ id: string; journey: Journey }> {
  try {
    const journeysCollection = collection(db, COLLECTIONS.JOURNEYS);
    const docRef = await addDoc(journeysCollection, {
      ...journeyData,
      bookedSeats: 0,
      acceptedPassengers: [],
      createdAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      journey: {
        id: docRef.id,
        ...journeyData,
        bookedSeats: 0,
        acceptedPassengers: [],
        createdAt: Timestamp.now(),
      } as Journey,
    };
  } catch (error) {
    throw new Error(`Failed to create journey: ${error}`);
  }
}

/**
 * Get journey by ID
 */
export async function getJourney(
  db: Firestore,
  journeyId: string
): Promise<Journey | null> {
  try {
    const journeyRef = doc(db, COLLECTIONS.JOURNEYS, journeyId);
    const journeyDoc = await getDoc(journeyRef);

    if (!journeyDoc.exists()) {
      return null;
    }

    return {
      id: journeyDoc.id,
      ...journeyDoc.data(),
    } as Journey;
  } catch (error) {
    throw new Error(`Failed to get journey: ${error}`);
  }
}

/**
 * Get all journeys by a specific driver
 */
export async function getJourneysByDriver(
  db: Firestore,
  driverId: string
): Promise<Journey[]> {
  try {
    const journeysCollection = collection(db, COLLECTIONS.JOURNEYS);
    const q = query(
      journeysCollection,
      where("driverId", "==", driverId),
      orderBy("departureDate", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Journey[];
  } catch (error) {
    throw new Error(`Failed to get journeys by driver: ${error}`);
  }
}

/**
 * Get available journeys (open status)
 */
export async function getAvailableJourneys(
  db: Firestore,
  pickupAddress?: string,
  pageSize = 10,
  lastDoc?: any
): Promise<Journey[]> {
  try {
    const journeysCollection = collection(db, COLLECTIONS.JOURNEYS);
    let q;

    if (pickupAddress) {
      q = query(
        journeysCollection,
        where("pickup.address", "==", pickupAddress),
        where("status", "==", "open"),
        orderBy("departureDate", "asc"),
        limit(pageSize)
      );
    } else {
      q = query(
        journeysCollection,
        where("status", "==", "open"),
        orderBy("departureDate", "asc"),
        limit(pageSize)
      );
    }

    if (lastDoc) {
      q = query(
        journeysCollection,
        where("status", "==", "open"),
        orderBy("departureDate", "asc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Journey[];
  } catch (error) {
    throw new Error(`Failed to get available journeys: ${error}`);
  }
}

/**
 * Update journey details
 */
export async function updateJourney(
  db: Firestore,
  journeyId: string,
  updates: Partial<Omit<Journey, "id" | "userId" | "driverId" | "createdAt">>
): Promise<void> {
  try {
    const journeyRef = doc(db, COLLECTIONS.JOURNEYS, journeyId);
    await updateDoc(journeyRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to update journey: ${error}`);
  }
}

/**
 * Update journey status
 */
export async function updateJourneyStatus(
  db: Firestore,
  journeyId: string,
  status: Journey["status"]
): Promise<void> {
  try {
    const journeyRef = doc(db, COLLECTIONS.JOURNEYS, journeyId);
    await updateDoc(journeyRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to update journey status: ${error}`);
  }
}

/**
 * Add passenger to accepted passengers list
 */
export async function addAcceptedPassenger(
  db: Firestore,
  journeyId: string,
  passengerId: string,
  seatsCount: number = 1
): Promise<void> {
  try {
    const journeyRef = doc(db, COLLECTIONS.JOURNEYS, journeyId);
    const journey = await getJourney(db, journeyId);

    if (!journey) throw new Error("Journey not found");

    const newBookedSeats = journey.bookedSeats + seatsCount;
    const acceptedPassengers = [...(journey.acceptedPassengers || [])];
    
    if (!acceptedPassengers.includes(passengerId)) {
      acceptedPassengers.push(passengerId);
    }

    // Check if journey is now full
    const status =
      newBookedSeats >= journey.availableSeats ? "full" : journey.status;

    await updateDoc(journeyRef, {
      acceptedPassengers,
      bookedSeats: increment(seatsCount),
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to add accepted passenger: ${error}`);
  }
}

/**
 * Remove passenger from accepted passengers list
 */
export async function removeAcceptedPassenger(
  db: Firestore,
  journeyId: string,
  passengerId: string,
  seatsCount: number = 1
): Promise<void> {
  try {
    const journeyRef = doc(db, COLLECTIONS.JOURNEYS, journeyId);
    const journey = await getJourney(db, journeyId);

    if (!journey) throw new Error("Journey not found");

    const acceptedPassengers = journey.acceptedPassengers.filter(
      (p) => p !== passengerId
    );
    const newBookedSeats = Math.max(0, journey.bookedSeats - seatsCount);

    // Reopen journey if it was full
    const status = newBookedSeats < journey.availableSeats ? "open" : journey.status;

    await updateDoc(journeyRef, {
      acceptedPassengers,
      bookedSeats: newBookedSeats,
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to remove accepted passenger: ${error}`);
  }
}

/**
 * Delete journey
 */
export async function deleteJourney(db: Firestore, journeyId: string): Promise<void> {
  try {
    const journeyRef = doc(db, COLLECTIONS.JOURNEYS, journeyId);
    await deleteDoc(journeyRef);
  } catch (error) {
    throw new Error(`Failed to delete journey: ${error}`);
  }
}
