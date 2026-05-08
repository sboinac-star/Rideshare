# Firebase Firestore Database Setup Guide

## Overview

This document provides instructions for setting up and configuring the Firestore database for the NWA RideShare (BlaBlaCar model) application.

## Database Structure

### Collections

#### 1. **drivers**
Stores driver profile information.

```typescript
{
  userId: string                    // Firebase Auth UID
  name: string                      // Driver's full name
  email: string                     // Email address
  phone: string                     // Phone number
  profileImage?: string             // URL to profile picture
  status: "active" | "inactive" | "suspended"
  rating: number                    // Average rating (1-5)
  completedRides: number            // Total completed rides
  createdAt: Timestamp              // Account creation date
  updatedAt?: Timestamp             // Last update date
}
```

#### 2. **passengers**
Stores passenger profile information.

```typescript
{
  userId: string                    // Firebase Auth UID
  name: string                      // Passenger's full name
  email: string                     // Email address
  phone: string                     // Phone number
  profileImage?: string             // URL to profile picture
  createdAt: Timestamp              // Account creation date
  updatedAt?: Timestamp             // Last update date
}
```

#### 3. **journeys**
Stores journey/ride information posted by drivers.

```typescript
{
  driverId: string                  // Reference to driver's document ID
  userId: string                    // Firebase Auth UID of driver
  pickup: {
    address: string                 // Pickup location address
    lat?: number                    // Latitude
    lng?: number                    // Longitude
  }
  dropoff: {
    address: string                 // Dropoff location address
    lat?: number                    // Latitude
    lng?: number                    // Longitude
  }
  departureDate: Timestamp          // Journey departure date/time
  returnDate?: Timestamp            // Return date for round trips
  availableSeats: number            // Total seats available
  bookedSeats: number               // Currently booked seats
  rideType: "oneway" | "roundtrip" | "regular"
  description?: string              // Journey description/notes
  status: "open" | "full" | "cancelled" | "completed"
  acceptedPassengers: string[]      // Array of passenger IDs
  createdAt: Timestamp              // Journey creation date
  updatedAt?: Timestamp             // Last update date
}
```

#### 4. **bookings**
Stores booking requests from passengers.

```typescript
{
  journeyId: string                 // Reference to journey document ID
  driverId: string                  // Reference to driver document ID
  passengerId: string               // Reference to passenger document ID
  userId: string                    // Firebase Auth UID of passenger
  seatsRequested: number            // Number of seats requested
  message: string                   // Passenger's booking message
  status: "pending" | "accepted" | "rejected" | "cancelled"
  createdAt: Timestamp              // Booking request date
  respondedAt?: Timestamp           // When driver responded
  driverMessage?: string            // Driver's response message
}
```

#### 5. **messages**
Stores direct messages between drivers and passengers.

```typescript
{
  journeyId: string                 // Associated journey document ID
  senderId: string                  // Firebase Auth UID of sender
  senderType: "driver" | "passenger"
  recipientId: string               // Firebase Auth UID of recipient
  content: string                   // Message content
  read: boolean                     // Read status
  createdAt: Timestamp              // Message sent date/time
}
```

## Firestore Indexes

To optimize query performance, create the following composite indexes in Firestore:

### Index 1: journeys collection
- **Fields**: `pickup.address` (Ascending), `status` (Ascending), `departureDate` (Ascending)
- **Use case**: Finding available journeys by pickup location

### Index 2: journeys collection
- **Fields**: `driverId` (Ascending), `departureDate` (Descending)
- **Use case**: Getting driver's posted journeys

### Index 3: bookings collection
- **Fields**: `journeyId` (Ascending), `status` (Ascending)
- **Use case**: Finding bookings for a specific journey

### Index 4: bookings collection
- **Fields**: `passengerId` (Ascending), `createdAt` (Descending)
- **Use case**: Getting passenger's booking history

### Index 5: messages collection
- **Fields**: `journeyId` (Ascending), `createdAt` (Ascending)
- **Use case**: Getting all messages in a journey conversation

### Index 6: messages collection
- **Fields**: `recipientId` (Ascending), `read` (Ascending), `createdAt` (Descending)
- **Use case**: Finding unread messages for a user

## Creating Indexes in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Enter the collection name and fields as specified above
6. Click **Create**

Or use the Firebase CLI:

```bash
firebase firestore:indexes
```

## Setting Up Collections

### Option 1: Manual Setup (Firebase Console)

1. Go to **Firestore Database** in Firebase Console
2. Click **+ Start Collection**
3. Create collections: `drivers`, `passengers`, `journeys`, `bookings`, `messages`
4. Add a test document to each collection (optional)

### Option 2: Programmatic Setup

Use the provided service layers to create documents:

```typescript
import { createDriver } from '@/lib/services/driver-service';
import { createJourney } from '@/lib/services/journey-service';
import { db } from '@/lib/firebase-server';

// Create a driver
const driverResult = await createDriver(db, {
  userId: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  status: 'active',
  rating: 5.0,
  completedRides: 0,
});

// Create a journey
const journeyResult = await createJourney(db, {
  driverId: driverResult.id,
  userId: 'user123',
  pickup: { address: '123 Main St' },
  dropoff: { address: '456 Oak Ave' },
  departureDate: new Timestamp(...),
  availableSeats: 4,
  rideType: 'oneway',
  status: 'open',
});
```

## Using Service Layers

The application includes service layers for each collection:

- **driver-service.ts**: Driver operations (create, update, get, delete)
- **journey-service.ts**: Journey operations
- **booking-service.ts**: Booking operations
- **message-service.ts**: Messaging operations

Example usage:

```typescript
import { getJourneysByDriver } from '@/lib/services/journey-service';

const driverJourneys = await getJourneysByDriver(db, driverId);
```

## Security Rules

Update your Firestore Security Rules in the Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read their own data
    match /drivers/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    match /passengers/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    match /journeys/{document=**} {
      allow read: if true;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
    }
    
    match /bookings/{document=**} {
      allow read: if request.auth.uid == resource.data.userId || 
                     request.auth.uid == resource.data.driverId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId || 
                      request.auth.uid == resource.data.driverId;
    }
    
    match /messages/{document=**} {
      allow read: if request.auth.uid == resource.data.senderId || 
                     request.auth.uid == resource.data.recipientId;
      allow create: if request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

## Environment Variables

Ensure these environment variables are set in your `.env.local` (development) and Netlify settings (production):

```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

## Database Query Examples

### Get all journeys for a driver
```typescript
const journeys = await getJourneysByDriver(db, driverId);
```

### Get available journeys
```typescript
const available = await getAvailableJourneys(db, pickupAddress);
```

### Get pending bookings for a driver
```typescript
const pending = await getPendingBookingsForDriver(db, driverId);
```

### Get messages in a journey
```typescript
const messages = await getMessagesByJourney(db, journeyId);
```

### Send a message
```typescript
await sendMessage(db, {
  journeyId: 'journey123',
  senderId: 'user123',
  senderType: 'driver',
  recipientId: 'user456',
  content: 'Hello, I have space for two more passengers!',
});
```

## Troubleshooting

### Error: "Collection not found"
- Create the collection in Firestore Console first
- Or create a document in that collection through the service layer

### Error: "Invalid query"
- Ensure composite indexes are created for complex queries
- Check Firebase Console → Firestore → Indexes for missing indexes

### Error: "Permission denied"
- Review Security Rules in Firebase Console
- Ensure user is authenticated before making requests

## Next Steps

1. Create Firestore collections
2. Set up composite indexes
3. Update Security Rules
4. Test the service layers with sample data
5. Integrate service layers into API routes

