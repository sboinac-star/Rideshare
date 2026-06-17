import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockUser = { uid: "user-456", phoneNumber: "+15005550002" };
const mockToast = vi.hoisted(() => vi.fn());
const mockAddDoc = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "new-request-id" }));
const mockUpdateDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDeleteDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockOnSnapshot = vi.hoisted(() => vi.fn());
const mockServerTimestamp = vi.hoisted(() => vi.fn(() => "SERVER_TIMESTAMP"));

vi.mock("@/lib/firebase", () => ({ db: {}, col: (n: string) => n }));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_, col) => col),
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  doc: vi.fn((db: unknown, col: string, id: string) => ({ col, id })),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: mockOnSnapshot,
  serverTimestamp: mockServerTimestamp,
}));

vi.mock("@/app/ToastProvider", () => ({ useToast: () => mockToast }));
vi.mock("@/app/AuthProvider", () => ({ useAuth: () => ({ user: mockUser, authLoading: false }) }));
vi.mock("@/app/SignInModal", () => ({ default: () => <div>SignInModal</div> }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/utils", () => ({
  formatDateTime: (s: string) => s,
  minDepartureTime: () => "2026-01-01T00:00",
  shareRequestText: vi.fn(() => "share request text"),
}));
vi.mock("@/lib/constants", () => ({ locations: ["Fayetteville", "Rogers", "Bentonville"] }));

const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16);

function setupEmptySnapshot() {
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    cb({ docs: [] });
    return vi.fn();
  });
}

function setupRequestSnapshot(overrides = {}) {
  let callCount = 0;
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    callCount++;
    if (callCount === 1) {
      // first call: requests
      cb({
        docs: [{
          id: "r1",
          data: () => ({
            passengerName: "Bob", from: "Bentonville", to: "Springdale",
            departureTime: future, seatsNeeded: 1,
            status: "active", roundTrip: false, createdAt: { seconds: 999 },
            ...overrides,
          }),
        }],
      });
    } else {
      // second call: journeys (empty)
      cb({ docs: [] });
    }
    return vi.fn();
  });
}

async function fillAndSubmitForm(departureTime = future) {
  const nameInput = screen.getByPlaceholderText(/enter your full name/i);
  fireEvent.change(nameInput, { target: { value: "Bob" } });

  const fromSelect = screen.getAllByRole("combobox")[0];
  fireEvent.change(fromSelect, { target: { value: "Bentonville" } });

  const toSelect = screen.getAllByRole("combobox")[1];
  fireEvent.change(toSelect, { target: { value: "Fayetteville" } });

  const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
  fireEvent.change(timeInput, { target: { value: departureTime } });

  fireEvent.submit(document.querySelector("form")!);
}

describe("PassengerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders post request form", async () => {
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: /post request/i })).toBeInTheDocument());
  });

  it("shows validation error if name is missing", async () => {
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByPlaceholderText(/enter your full name/i));
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
  });

  it("shows error toast for past travel time", async () => {
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByRole("button", { name: /post request/i }));
    await fillAndSubmitForm(past);
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Travel time must be in the future.", "error"));
  });

  it("successfully posts a request", async () => {
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByRole("button", { name: /post request/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    expect(mockToast).toHaveBeenCalledWith("Request posted! Drivers can now find you.");
  });

  it("shows success state after posting", async () => {
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByRole("button", { name: /post request/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(screen.getByText(/your request is live/i)).toBeInTheDocument());
  });

  it("shows error toast when addDoc fails", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("firestore error"));
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByRole("button", { name: /post request/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Failed to post request. Please try again.", "error"));
  });

  it("renders existing requests", async () => {
    setupRequestSnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => expect(screen.getByText("Bentonville → Springdale")).toBeInTheDocument());
  });

  it("cancels a request", async () => {
    setupRequestSnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /cancel/i })));
    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledWith(
      { col: "requests", id: "r1" }, { status: "cancelled" }
    ));
  });

  it("deletes a request", async () => {
    setupRequestSnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /delete/i })));
    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalled());
  });

  it("prevents duplicate request", async () => {
    // Snapshot with Bentonville → Fayetteville to match what we fill in the form
    setupRequestSnapshot({ from: "Bentonville", to: "Fayetteville", departureTime: future });
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByPlaceholderText(/enter your full name/i));

    const nameInput = screen.getByPlaceholderText(/enter your full name/i);
    fireEvent.change(nameInput, { target: { value: "Bob" } });
    const fromSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(fromSelect, { target: { value: "Bentonville" } });
    const toSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(toSelect, { target: { value: "Fayetteville" } });
    const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: future } });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      "You already have an active request with the same route and time.", "error"
    ));
  });
});
