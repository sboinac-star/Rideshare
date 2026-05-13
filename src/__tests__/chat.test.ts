import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — declare mocks with vi.hoisted so they exist before the hoist runs
const {
  mockDoc, mockCollection, mockGetDoc, mockSetDoc,
  mockAddDoc, mockUpdateDoc, mockOnSnapshot, mockQuery,
  mockOrderBy, mockWhere, mockServerTimestamp,
} = vi.hoisted(() => ({
  mockDoc: vi.fn(() => ({})),
  mockCollection: vi.fn(() => ({})),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn(() => ({})),
  mockOrderBy: vi.fn(),
  mockWhere: vi.fn(),
  mockServerTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  doc: mockDoc,
  collection: mockCollection,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  onSnapshot: mockOnSnapshot,
  query: mockQuery,
  orderBy: mockOrderBy,
  where: mockWhere,
  serverTimestamp: mockServerTimestamp,
}));

import {
  buildChatId,
  getOrCreateChat,
  sendMessage,
  subscribeToMessages,
  subscribeToUserChats,
} from "@/lib/chat";

beforeEach(() => vi.clearAllMocks());

// ─── buildChatId ─────────────────────────────────────────────────────────────

describe("buildChatId", () => {
  it("formats a journey chat id", () => {
    expect(buildChatId("journey", "j1", "u1")).toBe("journey_j1_u1");
  });

  it("formats a request chat id", () => {
    expect(buildChatId("request", "r1", "u1")).toBe("request_r1_u1");
  });

  it("preserves the initiator uid at the end", () => {
    expect(buildChatId("journey", "abc", "xyz").endsWith("xyz")).toBe(true);
  });
});

// ─── getOrCreateChat ─────────────────────────────────────────────────────────

describe("getOrCreateChat", () => {
  it("calls setDoc when the chat does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    mockSetDoc.mockResolvedValueOnce(undefined);

    await getOrCreateChat(
      "journey_j1_u1",
      ["owner", "u1"],
      "journey",
      "j1",
      "A → B",
      { owner: "Alice", u1: "+1234" },
    );

    expect(mockSetDoc).toHaveBeenCalledOnce();
    const data = mockSetDoc.mock.calls[0][1];
    expect(data.participants).toEqual(["owner", "u1"]);
    expect(data.listingType).toBe("journey");
    expect(data.route).toBe("A → B");
    expect(data.lastMessage).toBe("");
  });

  it("skips setDoc when the chat already exists", async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true });

    await getOrCreateChat("journey_j1_u1", ["owner", "u1"], "journey", "j1", "A → B", {});

    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

// ─── sendMessage ─────────────────────────────────────────────────────────────

describe("sendMessage", () => {
  it("adds a message document with correct fields", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "msg1" });
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await sendMessage("chatId", "u1", "Alice", "Hello!");

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const msgData = mockAddDoc.mock.calls[0][1];
    expect(msgData.uid).toBe("u1");
    expect(msgData.text).toBe("Hello!");
    expect(msgData.senderName).toBe("Alice");
  });

  it("updates lastMessage on the chat document", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "msg1" });
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await sendMessage("chatId", "u1", "Alice", "Hi there");

    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    expect(mockUpdateDoc.mock.calls[0][1].lastMessage).toBe("Hi there");
  });

  it("truncates lastMessage to 100 characters", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "msg1" });
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await sendMessage("chatId", "u1", "Alice", "x".repeat(200));

    expect(mockUpdateDoc.mock.calls[0][1].lastMessage).toHaveLength(100);
  });
});

// ─── subscribeToMessages ─────────────────────────────────────────────────────

describe("subscribeToMessages", () => {
  it("returns the unsubscribe function from onSnapshot", () => {
    const unsub = vi.fn();
    mockOnSnapshot.mockReturnValueOnce(unsub);

    const result = subscribeToMessages("chatId", vi.fn());
    expect(result).toBe(unsub);
  });

  it("maps snapshot docs to Message objects", () => {
    const fakeDate = new Date("2026-01-01");
    const callback = vi.fn();

    mockOnSnapshot.mockImplementationOnce((_q: unknown, cb: (snap: unknown) => void) => {
      cb({
        docs: [{
          id: "msg1",
          data: () => ({
            uid: "u1",
            senderName: "Alice",
            text: "Hey",
            createdAt: { toDate: () => fakeDate },
          }),
        }],
      });
      return vi.fn();
    });

    subscribeToMessages("chatId", callback);

    expect(callback).toHaveBeenCalledWith([
      { id: "msg1", uid: "u1", senderName: "Alice", text: "Hey", createdAt: fakeDate },
    ]);
  });

  it("handles missing createdAt gracefully", () => {
    const callback = vi.fn();

    mockOnSnapshot.mockImplementationOnce((_q: unknown, cb: (snap: unknown) => void) => {
      cb({
        docs: [{
          id: "msg1",
          data: () => ({ uid: "u1", senderName: "A", text: "Hi", createdAt: null }),
        }],
      });
      return vi.fn();
    });

    subscribeToMessages("chatId", callback);
    expect(callback.mock.calls[0][0][0].createdAt).toBeNull();
  });
});

// ─── subscribeToUserChats ────────────────────────────────────────────────────

describe("subscribeToUserChats", () => {
  it("returns the unsubscribe function", () => {
    const unsub = vi.fn();
    mockOnSnapshot.mockReturnValueOnce(unsub);

    const result = subscribeToUserChats("u1", vi.fn());
    expect(result).toBe(unsub);
  });

  it("maps snapshot docs to Chat objects", () => {
    const fakeDate = new Date("2026-01-01");
    const callback = vi.fn();

    mockOnSnapshot.mockImplementationOnce((_q: unknown, cb: (snap: unknown) => void) => {
      cb({
        docs: [{
          id: "chat1",
          data: () => ({
            participants: ["u1", "u2"],
            listingType: "journey",
            listingId: "j1",
            route: "A → B",
            participantNames: { u1: "Alice", u2: "Bob" },
            lastMessage: "Hi",
            updatedAt: { toDate: () => fakeDate },
          }),
        }],
      });
      return vi.fn();
    });

    subscribeToUserChats("u1", callback);

    const chat = callback.mock.calls[0][0][0];
    expect(chat.id).toBe("chat1");
    expect(chat.participants).toEqual(["u1", "u2"]);
    expect(chat.lastMessage).toBe("Hi");
    expect(chat.updatedAt).toEqual(fakeDate);
  });
});
