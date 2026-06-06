import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockUpdateDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDoc = vi.hoisted(() => vi.fn((db: unknown, col: string, id: string) => ({ col, id })));
const mockToast = vi.hoisted(() => vi.fn());

vi.mock("firebase/firestore", () => ({
  updateDoc: mockUpdateDoc,
  doc: mockDoc,
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("@/app/ToastProvider", () => ({
  useToast: () => mockToast,
}));

vi.mock("@/lib/utils", () => ({
  formatDateTime: (s: string) => s,
}));

import CompletionPromptModal from "@/app/CompletionPromptModal";

const items = [
  { id: "j1", type: "journey" as const, from: "Fayetteville", to: "Rogers", departureTime: "2026-05-01T10:00" },
  { id: "r1", type: "request" as const, from: "Bentonville", to: "Springdale", departureTime: "2026-05-02T12:00" },
];

describe("CompletionPromptModal", () => {
  const onDone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all pending items", () => {
    render(<CompletionPromptModal items={items} onDone={onDone} />);
    expect(screen.getByText("Fayetteville → Rogers")).toBeInTheDocument();
    expect(screen.getByText("Bentonville → Springdale")).toBeInTheDocument();
  });

  it("Continue button is disabled until all items are answered", () => {
    render(<CompletionPromptModal items={items} onDone={onDone} />);
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue button stays disabled when only some items are answered", () => {
    render(<CompletionPromptModal items={items} onDone={onDone} />);
    const completedButtons = screen.getAllByRole("button", { name: /^completed$/i });
    fireEvent.click(completedButtons[0]);
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue button is enabled when all items are answered", () => {
    render(<CompletionPromptModal items={items} onDone={onDone} />);
    const completedButtons = screen.getAllByRole("button", { name: /^completed$/i });
    fireEvent.click(completedButtons[0]);
    fireEvent.click(completedButtons[1]);
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("calls updateDoc for each item on submit and calls onDone", async () => {
    render(<CompletionPromptModal items={items} onDone={onDone} />);
    const completedButtons = screen.getAllByRole("button", { name: /^completed$/i });
    fireEvent.click(completedButtons[0]);
    const didNotHappenButtons = screen.getAllByRole("button", { name: /did not happen/i });
    fireEvent.click(didNotHappenButtons[1]);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
      expect(mockUpdateDoc).toHaveBeenCalledWith({ col: "journeys", id: "j1" }, { status: "completed" });
      expect(mockUpdateDoc).toHaveBeenCalledWith({ col: "requests", id: "r1" }, { status: "cancelled" });
    });
    expect(onDone).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith("Thanks for updating your ride status!");
  });

  it("shows error toast when updateDoc fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("network error"));
    render(<CompletionPromptModal items={[items[0]]} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /^completed$/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Failed to save. Please try again.", "error");
    });
    expect(onDone).not.toHaveBeenCalled();
  });

  it("highlights selected status button", () => {
    render(<CompletionPromptModal items={[items[0]]} onDone={onDone} />);
    const completedBtn = screen.getByRole("button", { name: /^completed$/i });
    fireEvent.click(completedBtn);
    expect(completedBtn.className).toContain("border-green-500");
  });

  it("shows helper text when not all answered", () => {
    render(<CompletionPromptModal items={items} onDone={onDone} />);
    expect(screen.getByText(/please update all rides above/i)).toBeInTheDocument();
  });

  it("hides helper text once all answered", () => {
    render(<CompletionPromptModal items={[items[0]]} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /^completed$/i }));
    expect(screen.queryByText(/please update all rides above/i)).not.toBeInTheDocument();
  });
});
