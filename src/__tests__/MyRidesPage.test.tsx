import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockUser = { uid: "user-123", phoneNumber: "+15005550001" };
const mockToast = vi.hoisted(() => vi.fn());
const mockUpdateDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDeleteDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDoc = vi.hoisted(() => vi.fn((db: unknown, col: string, id: string) => ({ col, id })));
const mockOnSnapshot = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase", () => ({ db: {}, col: (n: string) => n }));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: mockOnSnapshot,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  doc: mockDoc,
}));

vi.mock("@/app/ToastProvider", () => ({ useToast: () => mockToast }));
vi.mock("@/app/AuthProvider", () => ({ useAuth: () => ({ user: mockUser, authLoading: false }) }));
vi.mock("@/app/SignInModal", () => ({ default: () => <div>SignInModal</div> }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/utils", () => ({
  formatDateTime: (s: string) => s,
  minDepartureTime: () => "2026-01-01T00:00",
}));

const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16);

const makeJourneySnap = (overrides = {}) => ({
  docs: [{
    id: "j1",
    data: () => ({
      driverName: "Alice", from: "Fayetteville", to: "Rogers",
      departureTime: future, availableSeats: 2, driverPhone: "+15005550001",
      status: "active", roundTrip: false, createdAt: { seconds: 1000 },
      ...overrides,
    }),
  }],
});

const makeRequestSnap = (overrides = {}) => ({
  docs: [{
    id: "r1",
    data: () => ({
      passengerName: "Bob", from: "Bentonville", to: "Springdale",
      departureTime: future, seatsNeeded: 1, passengerPhone: "+15005550002",
      status: "active", roundTrip: false, createdAt: { seconds: 999 },
      ...overrides,
    }),
  }],
});

function setupSnapshots(journeyOverrides = {}, requestOverrides = {}) {
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    const snap = mockOnSnapshot.mock.calls.length % 2 === 1
      ? makeJourneySnap(journeyOverrides)
      : makeRequestSnap(requestOverrides);
    cb(snap);
    return vi.fn();
  });
}

describe("MyRidesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders journeys tab with route", async () => {
    setupSnapshots();
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => expect(screen.getByText("Fayetteville → Rogers")).toBeInTheDocument());
  });

  it("switches to requests tab", async () => {
    setupSnapshots();
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    fireEvent.click(screen.getByRole("button", { name: /my requests/i }));
    await waitFor(() => expect(screen.getByText("Bentonville → Springdale")).toBeInTheDocument());
  });

  it("shows green Active badge for active journey", async () => {
    setupSnapshots();
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
  });

  it("shows blue Completed badge for completed journey", async () => {
    setupSnapshots({ status: "completed" });
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => expect(screen.getByText("Completed")).toBeInTheDocument());
  });

  it("shows Edit button for future active journey", async () => {
    setupSnapshots({ departureTime: future });
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument());
  });

  it("shows Mark Completed button for past-due active journey", async () => {
    setupSnapshots({ departureTime: past });
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: /mark completed/i })).toBeInTheDocument());
  });

  it("calls updateDoc with completed status", async () => {
    setupSnapshots({ departureTime: past });
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /mark completed/i })));
    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledWith({ col: "journeys", id: "j1" }, { status: "completed" }));
    expect(mockToast).toHaveBeenCalledWith("Journey marked as completed.");
  });

  it("calls updateDoc with cancelled status when cancelling future journey", async () => {
    setupSnapshots({ departureTime: future });
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /^cancel$/i })));
    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledWith({ col: "journeys", id: "j1" }, { status: "cancelled" }));
  });

  it("calls deleteDoc when deleting a journey", async () => {
    setupSnapshots();
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /delete/i })));
    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalled());
    expect(mockToast).toHaveBeenCalledWith("Journey deleted.");
  });

  it("does not delete when confirm is rejected", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    setupSnapshots();
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /delete/i })));
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });

  it("shows error toast when cancel fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("fail"));
    setupSnapshots({ departureTime: future });
    const { default: MyRidesPage } = await import("@/app/my-rides/page");
    render(<MyRidesPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /^cancel$/i })));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Failed to cancel.", "error"));
  });
});
