export interface Journey {
  id: string;
  driverName: string;
  from: string;
  to: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  departureTime: string;
  availableSeats: number;
  driverPhone: string;
  status: string;
}

export interface RideRequest {
  id: string;
  passengerName: string;
  from: string;
  to: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  departureTime: string;
  seatsNeeded: number;
  passengerPhone: string;
  status: string;
}
