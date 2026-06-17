import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.hoisted(() => vi.fn());
const mockCollection = vi.hoisted(() => vi.fn((_, name) => name));

vi.mock("@/lib/firebase", () => ({ db: {}, col: (n: string) => n }));

vi.mock("firebase/firestore", () => ({
  collection: mockCollection,
  query: vi.fn(() => ({})),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(() => ({})),
  getDocs: mockGetDocs,
}));

import { lookupUserName } from "@/lib/chat";

beforeEach(() => vi.resetAllMocks());

describe("lookupUserName", () => {
  it("returns driverName from journeys using col() prefix", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ driverName: "Alice" }) }] })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    const name = await lookupUserName("uid-1");
    expect(name).toBe("Alice");
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "journeys");
  });

  it("falls back to passengerName from requests when no journey found", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ passengerName: "Bob" }) }] });

    const name = await lookupUserName("uid-2");
    expect(name).toBe("Bob");
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "requests");
  });

  it("returns 'User' when neither journey nor request found", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    const name = await lookupUserName("uid-3");
    expect(name).toBe("User");
  });

  it("skips empty driverName and checks requests", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ driverName: "" }) }] })
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ passengerName: "Carol" }) }] });

    const name = await lookupUserName("uid-4");
    expect(name).toBe("Carol");
  });
});
