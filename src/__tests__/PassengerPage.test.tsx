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
  minDepartureTime: () => "2026-01-01T00:00",
  shareRequestText: vi.fn(() => "share request text"),
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

  // DateTimePicker renders separate date + time inputs
  const [datePart, timePart] = departureTime.split("T");
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: datePart } });
  fireEvent.change(timeInput, { target: { value: timePart } });

  fireEvent.submit(document.querySelector("form")!);
}

describe("PassengerPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { getPendingCompletionItems } = await import("@/app/CompletionPromptModal");
    vi.mocked(getPendingCompletionItems).mockReturnValue([]);
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
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("Failed to post request"), "error"));
  });

  it("shows completion modal when there are pending past rides", async () => {
    const { getPendingCompletionItems } = await import("@/app/CompletionPromptModal");
    vi.mocked(getPendingCompletionItems).mockReturnValue([
      { id: "j-old", type: "journey", from: "A", to: "B", departureTime: past },
    ]);
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByRole("button", { name: /post request/i }));
    await fillAndSubmitForm();
    await waitFor(() => expect(screen.getByTestId("completion-modal")).toBeInTheDocument());
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

  it("posts a local ride request with same city for from and to", async () => {
    setupEmptySnapshot();
    const { default: PassengerPage } = await import("@/app/passenger/page");
    render(<PassengerPage />);
    await waitFor(() => screen.getByRole("button", { name: /^post request$/i }));

    // Switch to Local mode
    fireEvent.click(screen.getByRole("button", { name: /local/i }));

    const nameInput = screen.getByPlaceholderText(/enter your full name/i);
    fireEvent.change(nameInput, { target: { value: "Bob" } });

    // Local city text input
    const cityInput = screen.getByPlaceholderText(/Bentonville, Fayetteville/i);
    fireEvent.change(cityInput, { target: { value: "Rogers" } });

    // Pickup and dropoff — both use LocationInput with same placeholder
    const [pickupInput, dropoffInput] = screen.getAllByPlaceholderText(/Start typing an address/i);
    fireEvent.change(pickupInput, { target: { value: "456 Oak Ave" } });
    fireEvent.change(dropoffInput, { target: { value: "Pinnacle Hills" } });

    const [datePart, timePart] = future.split("T");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: datePart } });
    fireEvent.change(timeInput, { target: { value: timePart } });

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalledWith(
      "requests",
      expect.objectContaining({ from: "Rogers", to: "Rogers" })
    ));
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
    const [datePart, timePart] = future.split("T");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: datePart } });
    fireEvent.change(timeInput, { target: { value: timePart } });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      "You already have an active request with the same route and time.", "error"
    ));
  });
});
