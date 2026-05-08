/**
 * Driver Service Layer
 * Handles all driver-related database operations
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
  Timestamp,
  increment,
} from "firebase/firestore";
import { Driver, COLLECTIONS } from "../db";

/**
 * Register a new driver
 */
export async function createDriver(db: Firestore, driverData: Omit<Driver, "id" | "createdAt">): Promise<{ id: string; driver: Driver }> {
  try {
    const driversCollection = collection(db, COLLECTIONS.DRIVERS);
    const docRef = await addDoc(driversCollection, {
      ...driverData,
      createdAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      driver: {
        id: docRef.id,
        ...driverData,
        createdAt: Timestamp.now(),
      },
    };
  } catch (error) {
    throw new Error(`Failed to create driver: ${error}`);
  }
}

/**
 * Get driver by ID
 */
export async function getDriver(
  db: Firestore,
  driverId: string
): Promise<Driver | null> {
  try {
    const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    const driverDoc = await getDoc(driverRef);

    if (!driverDoc.exists()) {
      return null;
    }

    return {
      id: driverDoc.id,
      ...driverDoc.data(),
    } as Driver;
  } catch (error) {
    throw new Error(`Failed to get driver: ${error}`);
  }
}

/**
 * Get driver by userId
 */
export async function getDriverByUserId(
  db: Firestore,
  userId: string
): Promise<Driver | null> {
  try {
    const driversCollection = collection(db, COLLECTIONS.DRIVERS);
    const q = query(driversCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const driverDoc = querySnapshot.docs[0];
    return {
      id: driverDoc.id,
      ...driverDoc.data(),
    } as Driver;
  } catch (error) {
    throw new Error(`Failed to get driver by userId: ${error}`);
  }
}

/**
 * Update driver profile
 */
export async function updateDriver(
  db: Firestore,
  driverId: string,
  updates: Partial<Omit<Driver, "id" | "userId" | "createdAt">>
): Promise<void> {
  try {
    const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    await updateDoc(driverRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to update driver: ${error}`);
  }
}

/**
 * Update driver rating after a completed ride
 */
export async function updateDriverRating(
  db: Firestore,
  driverId: string,
  newRating: number
): Promise<void> {
  try {
    const driver = await getDriver(db, driverId);
    if (!driver) throw new Error("Driver not found");

    const currentRating = driver.rating || 5.0;
    const completedRides = driver.completedRides || 0;

    // Calculate average rating
    const averageRating = (currentRating * completedRides + newRating) / (completedRides + 1);

    const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    await updateDoc(driverRef, {
      rating: Math.round(averageRating * 10) / 10,
      completedRides: increment(1),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to update driver rating: ${error}`);
  }
}

/**
 * Deactivate driver account
 */
export async function deactivateDriver(
  db: Firestore,
  driverId: string
): Promise<void> {
  try {
    const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    await updateDoc(driverRef, {
      status: "inactive",
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Failed to deactivate driver: ${error}`);
  }
}

/**
 * Delete driver account
 */
export async function deleteDriver(db: Firestore, driverId: string): Promise<void> {
  try {
    const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    await deleteDoc(driverRef);
  } catch (error) {
    throw new Error(`Failed to delete driver: ${error}`);
  }
}
