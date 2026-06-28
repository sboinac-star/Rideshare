import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RatingModal from "@/app/RatingModal";

const mockToast = vi.fn();
vi.mock("@/app/ToastProvider", () => ({ useToast: () => mockToast }));

const mockGetIdToken = vi.fn().mockResolvedValue("tok-123");
vi.mock("@/app/AuthProvider", () => ({
  useAuth: () => ({ user: { uid: "user-1", getIdToken: mockGetIdToken } }),
}));

const onClose = vi.fn();
const defaultProps = {
  ratedUid: "driver-99",
  ratedName: "John Driver",
  journeyId: "journey-42",
  onClose,
};

describe("RatingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIdToken.mockResolvedValue("tok-123");
  });

  it("renders modal with driver name", () => {
    render(<RatingModal {...defaultProps} />);
    expect(screen.getByText(/Rate John Driver/)).toBeTruthy();
  });

  it("submit button disabled when no star selected", () => {
    render(<RatingModal {...defaultProps} />);
    const btn = screen.getByRole("button", { name: /submit/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("submit button enabled after selecting a star", async () => {
    render(<RatingModal {...defaultProps} />);
    const stars = screen.getAllByRole("button").filter((b) => b.textContent?.includes("☆") || b.textContent?.includes("⭐"));
    fireEvent.click(stars[2]); // 3 stars
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /submit/i });
      expect(btn.hasAttribute("disabled")).toBe(false);
    });
  });

  it("submits rating and calls onClose", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) }));
    render(<RatingModal {...defaultProps} />);
    const stars = screen.getAllByRole("button").filter((b) => b.textContent?.includes("☆") || b.textContent?.includes("⭐"));
    fireEvent.click(stars[4]); // 5 stars
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Rating submitted. Thank you!"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows already-rated error on 409", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: () => Promise.resolve({}) }));
    render(<RatingModal {...defaultProps} />);
    const stars = screen.getAllByRole("button").filter((b) => b.textContent?.includes("☆") || b.textContent?.includes("⭐"));
    fireEvent.click(stars[0]); // 1 star
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("You already rated this ride.", "error"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows error toast on failed submission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }));
    render(<RatingModal {...defaultProps} />);
    const stars = screen.getAllByRole("button").filter((b) => b.textContent?.includes("☆") || b.textContent?.includes("⭐"));
    fireEvent.click(stars[1]); // 2 stars
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Failed to submit rating.", "error"));
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<RatingModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("limits comment to 200 chars", () => {
    render(<RatingModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/optional comment/i);
    expect(textarea.getAttribute("maxlength")).toBe("200");
  });
});
