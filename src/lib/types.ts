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
}
