import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatch = vi.hoisted(() => vi.fn(() => ({ update: mockBatchUpdate, commit: mockBatchCommit })));
const mockGet = vi.hoisted(() => vi.fn());
const mockWhere = vi.hoisted(() => vi.fn(() => ({ where: mockWhere, get: mockGet })));
const mockCollection = vi.hoisted(() => vi.fn(() => ({ where: mockWhere })));
const mockAdminDb = vi.hoisted(() => vi.fn(() => ({ batch: mockBatch, collection: mockCollection })));
const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockAdminMessaging = vi.hoisted(() => vi.fn(() => ({ send: mockSend })));

vi.mock("@/lib/adminFirebase", () => ({
  adminDb: mockAdminDb,
  adminMessaging: mockAdminMessaging,
  adminCol: (n: string) => n,
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TS" },
}));

import { autoCompleteAndNudge } from "@/lib/autoComplete";

const future = new Date(Date.now() + 3600000).toISOString();
const past = new Date(Date.now() - 3600000).toISOString();

function makeSnap(docs: object[]) {
  return { docs: docs.map((d) => ({ ref: { id: "ref" }, data: () => d })) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBatch.mockReturnValue({ update: mockBatchUpdate, commit: mockBatchCommit });
});

describe("autoCompleteAndNudge", () => {
  it("commits batch and returns count when past active rides exist", async () => {
    mockGet.mockResolvedValue(makeSnap([
      { uid: "u1", from: "A", to: "B", departureTime: past },
    ]));
    // fcmTokens doc
    mockCollection.mockImplementation((name: string) => {
      if (name === "fcmTokens") return { doc: () => ({ get: async () => ({ data: () => null }) }) };
      return { where: mockWhere };
    });

    const count = await autoCompleteAndNudge();
    expect(mockBatchUpdate).toHaveBeenCalled();
    expect(mockBatchCommit).toHaveBeenCalled();
    expect(count).toBe(2); // journeys + requests both return 1 doc
  });

  it("commits batch even when ride doc has no uid (missing nudge target)", async () => {
    // doc without uid — still needs to be marked completed
    mockGet.mockResolvedValue(makeSnap([
      { from: "A", to: "B", departureTime: past }, // no uid
    ]));
    mockCollection.mockImplementation((name: string) => {
      if (name === "fcmTokens") return { doc: () => ({ get: async () => ({ data: () => null }) }) };
      return { where: mockWhere };
    });

    await autoCompleteAndNudge();
    expect(mockBatchUpdate).toHaveBeenCalled();
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it("does not commit batch when no past active rides", async () => {
    mockGet.mockResolvedValue(makeSnap([]));

    await autoCompleteAndNudge();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("returns 0 when no nudge targets found", async () => {
    mockGet.mockResolvedValue(makeSnap([]));
    const count = await autoCompleteAndNudge();
    expect(count).toBe(0);
  });
});
