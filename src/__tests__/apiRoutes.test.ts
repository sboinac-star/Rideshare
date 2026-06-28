import { describe, it, expect, vi, beforeEach } from "vitest";

// ── shared admin mocks ────────────────────────────────────────────────────────
const mockVerifyUser = vi.hoisted(() => vi.fn());
const mockVerifyAdmin = vi.hoisted(() => vi.fn());
const mockForbidden = vi.hoisted(() => vi.fn(() => new Response("Forbidden", { status: 403 })));
const mockDocGet = vi.hoisted(() => vi.fn());
const mockDocRef = vi.hoisted(() => vi.fn(() => ({ get: mockDocGet })));
const mockColAdd = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "new-id" }));
const mockColWhere = vi.hoisted(() => vi.fn());
const mockRunTransaction = vi.hoisted(() => vi.fn());
const mockCollection = vi.hoisted(() => vi.fn(() => ({
  where: mockColWhere,
  doc: mockDocRef,
  add: mockColAdd,
})));
const mockColSnap = vi.hoisted(() => vi.fn());
const mockAdminDb = vi.hoisted(() => vi.fn(() => ({
  collection: mockCollection,
  runTransaction: mockRunTransaction,
})));

vi.mock("@/lib/adminFirebase", () => ({
  adminDb: mockAdminDb,
  verifyUser: mockVerifyUser,
  verifyAdmin: mockVerifyAdmin,
  forbidden: mockForbidden,
  adminCol: (n: string) => n,
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TS", increment: (n: number) => `increment(${n})` },
}));

function makeReq(body: object, uid = "user-123") {
  mockVerifyUser.mockResolvedValue(uid);
  return new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
  });
}

beforeEach(() => vi.clearAllMocks());

// ── /api/watch ────────────────────────────────────────────────────────────────

describe("POST /api/watch (toggle watch)", () => {
  it("returns 401 when unauthenticated", async () => {
    mockVerifyUser.mockResolvedValue(null);
    const { POST } = await import("@/app/api/watch/route");
    const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ journeyId: "j1", route: "A → B" }) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when journeyId missing", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    const { POST } = await import("@/app/api/watch/route");
    const res = await POST(makeReq({ route: "A → B" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid");
  });

  it("adds watch when not already watching", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    mockColWhere.mockReturnValue({
      where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
      limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
      get: async () => ({ empty: true, docs: [] }),
    });
    const { POST } = await import("@/app/api/watch/route");
    const res = await POST(makeReq({ journeyId: "j1", route: "A → B" }));
    const json = await res.json();
    expect(json.watching).toBe(true);
  });

  it("removes watch when already watching", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    mockColWhere.mockReturnValue({
      where: () => ({ limit: () => ({ get: async () => ({ empty: false, docs: [{ ref: { delete: mockDelete } }] }) }) }),
      limit: () => ({ get: async () => ({ empty: false, docs: [{ ref: { delete: mockDelete } }] }) }),
    });
    const { POST } = await import("@/app/api/watch/route");
    const res = await POST(makeReq({ journeyId: "j1", route: "A → B" }));
    const json = await res.json();
    expect(json.watching).toBe(false);
    expect(mockDelete).toHaveBeenCalled();
  });
});

// ── /api/ratings ─────────────────────────────────────────────────────────────

describe("POST /api/ratings", () => {
  it("returns 401 when unauthenticated", async () => {
    mockVerifyUser.mockResolvedValue(null);
    const { POST } = await import("@/app/api/ratings/route");
    const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when score out of range", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    const { POST } = await import("@/app/api/ratings/route");
    const res = await POST(makeReq({ ratedUid: "user-2", journeyId: "j1", score: 6 }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid");
  });

  it("returns 400 when rating yourself", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    // self-check is before DB query — clear previous mock state
    mockColWhere.mockReturnValue({ where: vi.fn(), limit: vi.fn(() => ({ get: async () => ({ empty: true }) })), get: async () => ({ empty: true }) });
    const { POST } = await import("@/app/api/ratings/route");
    const res = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ ratedUid: "user-1", journeyId: "j1", score: 5 }),
      headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Cannot rate yourself");
  });

  it("returns 409 when already rated", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    mockColWhere.mockReturnValue({
      where: () => ({ limit: () => ({ get: async () => ({ empty: false }) }) }),
      limit: () => ({ get: async () => ({ empty: false }) }),
    });
    const { POST } = await import("@/app/api/ratings/route");
    const res = await POST(makeReq({ ratedUid: "user-2", journeyId: "j1", score: 5 }));
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toBe("Already rated");
  });
});

// ── /api/block ────────────────────────────────────────────────────────────────

describe("POST /api/block", () => {
  it("returns 401 when unauthenticated", async () => {
    mockVerifyUser.mockResolvedValue(null);
    const { POST } = await import("@/app/api/block/route");
    const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ blockedUid: "u2" }) });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when blockedUid missing", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    const { POST } = await import("@/app/api/block/route");
    const res = await POST(makeReq({}));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
  });
});

// ── /api/block/list ───────────────────────────────────────────────────────────

describe("GET /api/block/list", () => {
  it("returns 403 when unauthenticated", async () => {
    mockVerifyUser.mockResolvedValue(null);
    const { GET } = await import("@/app/api/block/list/route");
    const req = new Request("http://localhost");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns uids of blocked users", async () => {
    mockVerifyUser.mockResolvedValue("user-1");
    mockColWhere.mockReturnValue({
      get: async () => ({
        docs: [
          { data: () => ({ blockedUid: "u2" }) },
          { data: () => ({ blockedUid: "u3" }) },
        ],
      }),
    });
    const { GET } = await import("@/app/api/block/list/route");
    const req = new Request("http://localhost", { headers: { Authorization: "Bearer token" } });
    const res = await GET(req);
    const json = await res.json();
    expect(json.uids).toEqual(["u2", "u3"]);
  });
});

// ── /api/cron/auto-complete auth guard ───────────────────────────────────────

describe("GET /api/cron/auto-complete auth guard", () => {
  it("returns 401 when no secret env and no cron header", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("@/app/api/cron/auto-complete/route");
    const req = new Request("http://localhost/api/cron/auto-complete");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret set but wrong value provided", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const { GET } = await import("@/app/api/cron/auto-complete/route");
    const req = new Request("http://localhost/api/cron/auto-complete?secret=wrong");
    const res = await GET(req);
    expect(res.status).toBe(401);
    delete process.env.CRON_SECRET;
  });
});
