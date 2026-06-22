import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {}, col: (n: string) => n }));
vi.mock("firebase/firestore", () => ({ updateDoc: vi.fn(), doc: vi.fn() }));
vi.mock("@/app/ToastProvider", () => ({ useToast: () => vi.fn() }));
vi.mock("@/lib/utils", () => ({ formatDateTime: (s: string) => s }));

import { getPendingCompletionItems } from "@/app/CompletionPromptModal";
import type { Journey, RideRequest } from "@/lib/types";

// Generate timestamps in LOCAL time format (no timezone suffix) to match
// how datetime-local inputs and Firestore data are stored and compared.
// toISOString() returns UTC, which new Date(str) would misinterpret as local
// time in non-UTC timezones, causing isPast checks to flip.
function localISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const future = localISO(new Date(Date.now() + 60 * 60 * 1000));
const past = localISO(new Date(Date.now() - 60 * 60 * 1000));

const makeJourney = (overrides: Partial<Journey> = {}): Journey => ({
  id: "j1",
  driverName: "Alice",
  from: "Fayetteville",
  to: "Rogers",
  departureTime: past,
  availableSeats: 2,
  status: "active",
  ...overrides,
});

const makeRequest = (overrides: Partial<RideRequest> = {}): RideRequest => ({
  id: "r1",
  passengerName: "Bob",
  from: "Bentonville",
  to: "Springdale",
  departureTime: past,
  seatsNeeded: 1,
  status: "active",
  ...overrides,
});

describe("getPendingCompletionItems", () => {
  it("returns empty array when no past-due active rides", () => {
    const journeys = [makeJourney({ departureTime: future })];
    const requests = [makeRequest({ departureTime: future })];
    expect(getPendingCompletionItems(journeys, requests)).toHaveLength(0);
  });

  it("includes past-due active journeys", () => {
    const journeys = [makeJourney({ id: "j1", departureTime: past })];
    const result = getPendingCompletionItems(journeys, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "j1", type: "journey", from: "Fayetteville", to: "Rogers" });
  });

  it("includes past-due active requests", () => {
    const requests = [makeRequest({ id: "r1", departureTime: past })];
    const result = getPendingCompletionItems([], requests);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "r1", type: "request", from: "Bentonville", to: "Springdale" });
  });

  it("excludes cancelled journeys even if past", () => {
    const journeys = [makeJourney({ status: "cancelled" })];
    expect(getPendingCompletionItems(journeys, [])).toHaveLength(0);
  });

  it("excludes completed journeys even if past", () => {
    const journeys = [makeJourney({ status: "completed" })];
    expect(getPendingCompletionItems(journeys, [])).toHaveLength(0);
  });

  it("excludes future active journeys", () => {
    const journeys = [makeJourney({ departureTime: future })];
    expect(getPendingCompletionItems(journeys, [])).toHaveLength(0);
  });

  it("returns both journeys and requests when both are past-due active", () => {
    const journeys = [makeJourney({ id: "j1" }), makeJourney({ id: "j2", departureTime: future })];
    const requests = [makeRequest({ id: "r1" })];
    const result = getPendingCompletionItems(journeys, requests);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toContain("j1");
    expect(result.map((i) => i.id)).toContain("r1");
  });

  it("returns empty when all arrays are empty", () => {
    expect(getPendingCompletionItems([], [])).toHaveLength(0);
  });
});
