/**
 * Firebase Firestore Database Schema and Types
 * BlaBlaCar-style Rideshare App
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

/**
 * ==================== COLLECTION SCHEMAS ====================
 */

/** Driver Profile Collection */
export interface Driver {
  id?: string;
  userId: string; // Firebase Auth UID
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  status: "active" | "inactive" | "suspended";
  rating: number; // 1-5 stars
  completedRides: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** Passenger Profile Collection */
export interface Passenger {
  id?: string;
  userId: string; // Firebase Auth UID
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** Journey/Ride Posted by Driver */
export interface Journey {
  id?: string;
  driverId: string; // Driver's ID in drivers collection
  userId: string; // Firebase Auth UID of driver
  pickup: {
    address: string;
    lat?: number;
    lng?: number;
  };
  dropoff: {
    address: string;
    lat?: number;
    lng?: number;
  };
  departureDate: Timestamp;
  returnDate?: Timestamp; // For round trips
  availableSeats: number;
  bookedSeats: number;
  rideType: "oneway" | "roundtrip" | "regular";
  description?: string;
  status: "open" | "full" | "cancelled" | "completed";
  acceptedPassengers: string[]; // Array of passenger IDs
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** Booking Request from Passenger */
export interface Booking {
  id?: string;
  journeyId: string; // Reference to journey
  driverId: string; // Driver's ID
  passengerId: string; // Passenger's ID
  userId: string; // Firebase Auth UID of passenger
  seatsRequested: number;
  message: string; // Passenger's message/request
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: Timestamp;
  respondedAt?: Timestamp;
  driverMessage?: string; // Driver's response message
}

/**
 * ==================== COLLECTION REFERENCES ====================
 */

export const COLLECTIONS = {
  DRIVERS: "drivers",
  PASSENGERS: "passengers",
  JOURNEYS: "journeys",
  BOOKINGS: "bookings",
} as const;

/**
 * Get collection reference
 */
export const getCollectionRef = (db: any, collectionName: string) => {
  return collection(db, collectionName);
};

/**
 * Get document reference
 */
export const getDocRef = (db: any, collectionName: string, docId: string) => {
  return doc(db, collectionName, docId);
};

/**
 * ==================== QUERY BUILDERS ====================
 */

/**
 * Query builder for drivers by userId
 */
export const queryDriverByUserId = (db: any, userId: string) => {
  return query(
    collection(db, COLLECTIONS.DRIVERS),
    where("userId", "==", userId)
  );
};

/**
 * Query builder for journeys by driver
 */
export const queryJourneysByDriver = (db: any, driverId: string) => {
  return query(
    collection(db, COLLECTIONS.JOURNEYS),
    where("driverId", "==", driverId),
    orderBy("departureDate", "desc")
  );
};

/**
 * Query builder for available journeys
 */
export const queryAvailableJourneys = (db: any, pickup: string) => {
  return query(
    collection(db, COLLECTIONS.JOURNEYS),
    where("pickup.address", "==", pickup),
    where("status", "==", "open"),
    orderBy("departureDate", "asc")
  );
};

/**
 * Query builder for bookings by journey
 */
export const queryBookingsByJourney = (db: any, journeyId: string) => {
  return query(
    collection(db, COLLECTIONS.BOOKINGS),
    where("journeyId", "==", journeyId)
  );
};

/**
 * Query builder for bookings by passenger
 */
export const queryBookingsByPassenger = (db: any, passengerId: string) => {
  return query(
    collection(db, COLLECTIONS.BOOKINGS),
    where("passengerId", "==", passengerId),
    orderBy("createdAt", "desc")
  );
};

/**
 * ==================== FIRESTORE INDEXES ====================
 */

/**
 * Recommended Firestore Indexes for optimal performance
 *
 * 1. journeys collection:
 *    - (pickup.address, status, departureDate)
 *    - (driverId, departureDate)
 *
 * 2. bookings collection:
 *    - (journeyId, status)
 *    - (passengerId, createdAt)
 *
 * Create these in Firebase Console > Firestore Database > Indexes
 */

/**
 * ==================== HELPER TYPES ====================
 */

export type JourneyStatus = Journey["status"];
export type BookingStatus = Booking["status"];
export type DriverStatus = Driver["status"];
export type RideType = Journey["rideType"];
