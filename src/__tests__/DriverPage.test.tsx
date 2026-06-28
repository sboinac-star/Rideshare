import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockUser = { uid: "user-123", phoneNumber: "+15005550001" };
const mockToast = vi.hoisted(() => vi.fn());
const mockAddDoc = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "new-journey-id" }));
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
vi.mock("@/app/CompletionPromptModal", () => ({
  default: ({ onDone }: { onDone: () => void }) => (
    <div data-testid="completion-modal">
      <button onClick={onDone}>Done</button>
    </div>
  ),
  getPendingCompletionItems: vi.fn(() => []),
}));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/utils", () => ({
  formatDateTime: (s: string) => s,
  formatTimeRange: (s: string) => s,
  minDepartureTime: () => "2026-01-01T00:00",
  shareText: vi.fn(() => "share text"),
}));
vi.mock("@/lib/constants", () => ({ locations: ["Fayetteville", "Rogers", "Bentonville"] }));

// Generate timestamps in LOCAL time format — new Date(str) with no timezone
// suffix treats the string as local time, so UTC strings from toISOString()
// cause isPast checks to flip in non-UTC timezones (e.g. CDT = UTC-5).
function localISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const future = localISO(new Date(Date.now() + 2 * 60 * 60 * 1000));
const past = localISO(new Date(Date.now() - 2 * 60 * 60 * 1000));

function setupEmptySnapshot() {
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    cb({ docs: [] });
    return vi.fn();
  });
}

function setupJourneySnapshot(overrides = {}) {
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    cb({
      docs: [{
        id: "j1",
        data: () => ({
          driverName: "Alice", from: "Fayetteville", to: "Rogers",
          departureTime: future, availableSeats: 2,
          status: "active", roundTrip: false, createdAt: { seconds: 1000 },
          ...overrides,
        }),
      }],
    });
    return vi.fn();
  });
}

async function fillAndSubmitForm(departureTime = future) {
  const nameInput = screen.getByPlaceholderText(/enter your full name/i);
  fireEvent.change(nameInput, { target: { value: "Alice" } });

  const fromSelect = screen.getAllByRole("combobox")[0];
  fireEvent.change(fromSelect, { target: { value: "Fayetteville" } });

  const toSelect = screen.getAllByRole("combobox")[1];
  fireEvent.change(toSelect, { target: { value: "Rogers" } });

  // DateTimePicker renders separate date + time inputs
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: departureTime.substring(0, 10) } });
  fireEvent.change(timeInput, { target: { value: departureTime.substring(11, 16) } });

  fireEvent.submit(document.querySelector("form")!);
}

describe("DriverPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders post journey form", async () => {
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: /post journey/i })).toBeInTheDocument());
  });

  it("shows validation error if name is missing", async () => {
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByPlaceholderText(/enter your full name/i));
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
  });

  it("shows error toast for past departure time", async () => {
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByRole("button", { name: /post journey/i }));
    await fillAndSubmitForm(past);
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Departure time must be in the future.", "error"));
  });

  it("successfully posts a journey", async () => {
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByRole("button", { name: /post journey/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    expect(mockToast).toHaveBeenCalledWith("Journey posted! Passengers can now find you.");
  });

  it("includes driverPhone in posted journey doc", async () => {
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByRole("button", { name: /post journey/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    const docData = mockAddDoc.mock.calls[0][1];
    expect(docData).toHaveProperty("driverPhone", mockUser.phoneNumber);
  });

  it("shows success state after posting", async () => {
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByRole("button", { name: /post journey/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(screen.getByText(/your journey is live/i)).toBeInTheDocument());
  });

  it("shows error toast when addDoc fails", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("firestore error"));
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByRole("button", { name: /post journey/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("Failed to post journey"), "error"));
  });

  it("shows completion modal when there are pending past rides", async () => {
    const { getPendingCompletionItems } = await import("@/app/CompletionPromptModal");
    vi.mocked(getPendingCompletionItems).mockReturnValue([
      { id: "j-old", type: "journey", from: "A", to: "B", departureTime: past },
    ]);
    setupEmptySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByRole("button", { name: /post journey/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(screen.getByTestId("completion-modal")).toBeInTheDocument());
  });

  it("renders existing journeys", async () => {
    setupJourneySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => expect(screen.getByText("Fayetteville → Rogers")).toBeInTheDocument());
  });

  it("cancels a journey", async () => {
    setupJourneySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /cancel/i })));
    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledWith({ col: "journeys", id: "j1" }, { status: "cancelled" }));
  });

  it("deletes a journey", async () => {
    setupJourneySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /delete/i })));
    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalled());
  });

  it("prevents duplicate journey", async () => {
    setupJourneySnapshot();
    const { default: DriverPage } = await import("@/app/driver/page");
    render(<DriverPage />);
    await waitFor(() => screen.getByRole("button", { name: /^post journey$/i }));

    const nameInput = screen.getByPlaceholderText(/enter your full name/i);
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    const fromSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(fromSelect, { target: { value: "Fayetteville" } });
    const toSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(toSelect, { target: { value: "Rogers" } });
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: future.substring(0, 10) } });
    fireEvent.change(timeInput, { target: { value: future.substring(11, 16) } });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      "You already have an active journey with the same route and time.", "error"
    ));
  });
});
