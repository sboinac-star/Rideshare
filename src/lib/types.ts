export interface Journey {
  id: string;
  uid?: string;
  driverName: string;
  from: string;
  to: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  departureTime: string;
  availableSeats: number;
  driverPhone: string;
  status: string;
  roundTrip?: boolean;
  returnTime?: string;
}

export interface RideRequest {
  id: string;
  uid?: string;
  passengerName: string;
  from: string;
  to: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  departureTime: string;
  seatsNeeded: number;
  passengerPhone: string;
  status: string;
  roundTrip?: boolean;
  returnTime?: string;
}

export interface Message {
  id: string;
  uid: string;
  senderName: string;
  text: string;
  createdAt: Date | null;
}

export interface RideWatch {
  id: string;
  uid: string;
  journeyId: string;
  route: string;
}

export interface Chat {
  id: string;
  participants: string[];
  listingType: "journey" | "request";
  listingId: string;
  route: string;
  participantNames: Record<string, string>;
  lastMessage: string;
  updatedAt: Date | null;
}
