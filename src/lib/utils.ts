export function formatDateTime(dt: string): string {
  if (!dt) return dt;
  return new Date(dt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function isPast(dt: string): boolean {
  return new Date(dt) < new Date();
}

export function isToday(dt: string): boolean {
  return new Date(dt).toDateString() === new Date().toDateString();
}

export function isThisWeekend(dt: string): boolean {
  const date = new Date(dt);
  const now = new Date();
  const inTwoWeeks = new Date(now);
  inTwoWeeks.setDate(now.getDate() + 14);
  const day = date.getDay();
  return (day === 0 || day === 6) && date >= now && date <= inTwoWeeks;
}

export function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function relativeTime(dt: string): string {
  const date = new Date(dt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours === 1) return "in 1 hour";
  if (diffHours < 24) return `in ${diffHours} hours`;
  if (diffDays === 1) return "tomorrow";
  if (diffDays < 7) return `in ${diffDays} days`;
  return "";
}

export function shareText(
  journey: {
    driverName: string;
    from: string;
    to: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    departureTime: string;
    availableSeats: number;
    driverPhone: string;
  },
  url?: string
): string {
  const lines = [
    `🚗 Rideshare: ${journey.from} → ${journey.to}`,
    journey.pickupAddress ? `📍 Pickup: ${journey.pickupAddress}` : "",
    journey.dropoffAddress ? `📍 Dropoff: ${journey.dropoffAddress}` : "",
    `📅 ${formatDateTime(journey.departureTime)}`,
    `💺 ${journey.availableSeats} seat${journey.availableSeats !== 1 ? "s" : ""} available`,
    `📞 Contact: ${formatPhone(journey.driverPhone)}`,
    `🔗 ${url ?? "https://nwa-rideshare.vercel.app"}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function shareRequestText(
  req: {
    passengerName: string;
    from: string;
    to: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    departureTime: string;
    seatsNeeded: number;
    passengerPhone: string;
  },
  url?: string
): string {
  const lines = [
    `🙋 Ride Needed: ${req.from} → ${req.to}`,
    req.pickupAddress ? `📍 Pickup: ${req.pickupAddress}` : "",
    req.dropoffAddress ? `📍 Dropoff: ${req.dropoffAddress}` : "",
    `📅 ${formatDateTime(req.departureTime)}`,
    `💺 ${req.seatsNeeded} seat${req.seatsNeeded !== 1 ? "s" : ""} needed`,
    `📞 Contact: ${formatPhone(req.passengerPhone)}`,
    `🔗 ${url ?? "https://nwa-rideshare.vercel.app"}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function minDepartureTime(): string {
  return new Date().toISOString().slice(0, 16);
}
