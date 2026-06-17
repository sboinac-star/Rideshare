import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatPhone,
  formatDateTime,
  isPast,
  isToday,
  relativeTime,
  shareText,
  shareRequestText,
  whatsappLink,
} from "@/lib/utils";

// ─── formatPhone ────────────────────────────────────────────────────────────

describe("formatPhone", () => {
  it("formats a 10-digit number", () => {
    expect(formatPhone("4795550123")).toBe("(479) 555-0123");
  });

  it("formats an 11-digit number starting with 1", () => {
    expect(formatPhone("14795550123")).toBe("+1 (479) 555-0123");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatPhone("(479) 555-0123")).toBe("(479) 555-0123");
    expect(formatPhone("479.555.0123")).toBe("(479) 555-0123");
  });

  it("returns the original value for unrecognised lengths", () => {
    expect(formatPhone("12345")).toBe("12345");
  });
});

// ─── formatDateTime ─────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("returns the input unchanged for falsy values", () => {
    expect(formatDateTime("")).toBe("");
  });

  it("produces a human-readable date string", () => {
    const result = formatDateTime("2026-06-01T10:00");
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/10:00|10 AM/i);
  });
});

// ─── isPast ─────────────────────────────────────────────────────────────────

describe("isPast", () => {
  it("returns true for a date in the past", () => {
    expect(isPast("2020-01-01T00:00")).toBe(true);
  });

  it("returns false for a date in the future", () => {
    expect(isPast("2099-01-01T00:00")).toBe(false);
  });
});

// ─── isToday ────────────────────────────────────────────────────────────────

describe("isToday", () => {
  it("returns true for today's date at any time", () => {
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    expect(isToday(today.toISOString())).toBe(true);
  });

  it("returns false for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday.toISOString())).toBe(false);
  });

  it("returns false for tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isToday(tomorrow.toISOString())).toBe(false);
  });
});

// ─── relativeTime ────────────────────────────────────────────────────────────

describe("relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T12:00:00"));
  });

  it("returns 'in X hours' for same-day future times", () => {
    expect(relativeTime("2026-05-11T14:00:00")).toBe("in 2 hours");
  });

  it("returns 'in 1 hour' for ~60 minutes away", () => {
    expect(relativeTime("2026-05-11T13:00:00")).toBe("in 1 hour");
  });

  it("returns 'tomorrow' for next-day departures", () => {
    expect(relativeTime("2026-05-12T12:00:00")).toBe("tomorrow");
  });

  it("returns 'in X days' for departures within a week", () => {
    expect(relativeTime("2026-05-14T12:00:00")).toBe("in 3 days");
  });

  it("returns empty string for departures more than a week away", () => {
    expect(relativeTime("2026-05-25T12:00:00")).toBe("");
  });

  it("returns 'in Xm' for departures under an hour away", () => {
    expect(relativeTime("2026-05-11T12:30:00")).toBe("in 30m");
  });
});

// ─── whatsappLink ────────────────────────────────────────────────────────────

describe("whatsappLink", () => {
  it("strips non-digits and builds a wa.me URL", () => {
    expect(whatsappLink("(479) 555-0123")).toBe("https://wa.me/4795550123");
  });
});

// ─── shareText ───────────────────────────────────────────────────────────────

describe("shareText", () => {
  const journey = {
    driverName: "Alice",
    from: "Bentonville",
    to: "Dallas",
    departureTime: "2026-06-01T08:00",
    availableSeats: 2,
  };

  it("contains route and seat count", () => {
    const text = shareText(journey);
    expect(text).toContain("Bentonville → Dallas");
    expect(text).toContain("2 seats available");
    expect(text).not.toContain("Contact:");
  });

  it("includes a custom URL when provided", () => {
    const url = "https://nwa-rideshare.vercel.app/journey/abc123";
    const text = shareText(journey, url);
    expect(text).toContain(url);
  });

  it("includes optional pickup and dropoff addresses", () => {
    const text = shareText({ ...journey, pickupAddress: "123 Main St", dropoffAddress: "Love Field" });
    expect(text).toContain("123 Main St");
    expect(text).toContain("Love Field");
  });

  it("omits address lines when not provided", () => {
    const text = shareText(journey);
    expect(text).not.toContain("Pickup:");
    expect(text).not.toContain("Dropoff:");
  });

  it("uses singular 'seat' for 1 seat", () => {
    expect(shareText({ ...journey, availableSeats: 1 })).toContain("1 seat available");
  });
});

// ─── shareRequestText ────────────────────────────────────────────────────────

describe("shareRequestText", () => {
  const req = {
    passengerName: "Bob",
    from: "Fayetteville",
    to: "OKC",
    departureTime: "2026-06-01T09:00",
    seatsNeeded: 1,
  };

  it("contains route and seats needed", () => {
    const text = shareRequestText(req);
    expect(text).toContain("Fayetteville → OKC");
    expect(text).toContain("1 seat needed");
  });

  it("includes a custom URL when provided", () => {
    const url = "https://nwa-rideshare.vercel.app/request/xyz";
    expect(shareRequestText(req, url)).toContain(url);
  });

  it("uses plural 'seats' for more than 1", () => {
    expect(shareRequestText({ ...req, seatsNeeded: 3 })).toContain("3 seats needed");
  });
});

// ─── validation helpers (inline, mirrors page logic) ─────────────────────────

function validateName(value: string): string {
  if (!value) return "Name is required";
  if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces";
  return "";
}

function validatePhone(value: string): string {
  if (!value) return "Phone number is required";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a valid phone number (at least 10 digits)";
  return "";
}

describe("validateName", () => {
  it("rejects an empty name", () => {
    expect(validateName("")).toBe("Name is required");
  });

  it("rejects names with numbers or special characters", () => {
    expect(validateName("Alice123")).not.toBe("");
    expect(validateName("Bob@Smith")).not.toBe("");
  });

  it("accepts letters and spaces", () => {
    expect(validateName("Alice Smith")).toBe("");
    expect(validateName("John")).toBe("");
  });
});

describe("validatePhone", () => {
  it("rejects an empty value", () => {
    expect(validatePhone("")).toBe("Phone number is required");
  });

  it("rejects fewer than 10 digits", () => {
    expect(validatePhone("12345")).not.toBe("");
  });

  it("accepts a 10-digit number", () => {
    expect(validatePhone("4795550123")).toBe("");
  });

  it("accepts formatted numbers by stripping non-digits", () => {
    expect(validatePhone("(479) 555-0123")).toBe("");
  });
});
