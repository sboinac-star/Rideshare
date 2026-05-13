import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeleteListingButton from "@/features/listings/DeleteListingButton";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/lib/firebase", () => ({ db: {} }));

const { mockDeleteDoc, mockDoc } = vi.hoisted(() => ({
  mockDeleteDoc: vi.fn(),
  mockDoc: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  doc: mockDoc,
  deleteDoc: mockDeleteDoc,
}));

const mockUseAuth = vi.fn();
vi.mock("@/app/AuthProvider", () => ({ useAuth: () => mockUseAuth() }));

describe("DeleteListingButton", () => {
  const defaultProps = {
    collection: "journeys" as const,
    docId: "doc123",
    ownerUid: "user1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { uid: "user1" } });
  });

  it("renders delete button when user is owner", () => {
    render(<DeleteListingButton {...defaultProps} />);
    expect(screen.getByText("Delete this listing")).toBeInTheDocument();
  });

  it("renders nothing when user is not owner", () => {
    mockUseAuth.mockReturnValue({ user: { uid: "other" } });
    const { container } = render(<DeleteListingButton {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when user is not signed in", () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<DeleteListingButton {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows confirmation UI when delete button is clicked", () => {
    render(<DeleteListingButton {...defaultProps} />);
    fireEvent.click(screen.getByText("Delete this listing"));
    expect(screen.getByText("This will permanently delete the listing.")).toBeInTheDocument();
    expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("returns to initial state when cancel is clicked", () => {
    render(<DeleteListingButton {...defaultProps} />);
    fireEvent.click(screen.getByText("Delete this listing"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Delete this listing")).toBeInTheDocument();
  });

  it("calls deleteDoc and redirects on confirmation", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);
    render(<DeleteListingButton {...defaultProps} />);
    fireEvent.click(screen.getByText("Delete this listing"));
    fireEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalledOnce());
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("resets to initial state when delete fails", async () => {
    mockDeleteDoc.mockRejectedValue(new Error("Firestore error"));
    render(<DeleteListingButton {...defaultProps} />);
    fireEvent.click(screen.getByText("Delete this listing"));
    fireEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() =>
      expect(screen.getByText("Delete this listing")).toBeInTheDocument()
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
