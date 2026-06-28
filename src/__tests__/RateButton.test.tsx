import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RateButton from "@/app/RateButton";

vi.mock("@/app/ToastProvider", () => ({ useToast: () => vi.fn() }));

const mockGetIdToken = vi.fn().mockResolvedValue("tok-456");
let currentUid = "passenger-1";
let currentUser: { uid: string; getIdToken: typeof mockGetIdToken } | null = { uid: currentUid, getIdToken: mockGetIdToken };

vi.mock("@/app/AuthProvider", () => ({
  useAuth: () => ({ user: currentUser }),
}));

describe("RateButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { uid: "passenger-1", getIdToken: mockGetIdToken };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rating: null, count: 0 }) }));
  });

  it("renders nothing when user is not logged in", () => {
    currentUser = null;
    const { container } = render(<RateButton ratedUid="driver-99" ratedName="John" journeyId="j-1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when ratedUid is undefined", () => {
    const { container } = render(<RateButton ratedUid={undefined} ratedName="John" journeyId="j-1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when user is the driver (same uid)", () => {
    currentUser = { uid: "driver-99", getIdToken: mockGetIdToken };
    const { container } = render(<RateButton ratedUid="driver-99" ratedName="John" journeyId="j-1" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows Rate button for a passenger viewing a different driver", () => {
    render(<RateButton ratedUid="driver-99" ratedName="John" journeyId="j-1" />);
    expect(screen.getByText(/Rate this driver/)).toBeTruthy();
  });

  it("opens RatingModal when Rate button is clicked", () => {
    render(<RateButton ratedUid="driver-99" ratedName="John Driver" journeyId="j-1" />);
    fireEvent.click(screen.getByText(/Rate this driver/));
    expect(screen.getByText(/Rate John Driver/)).toBeTruthy();
  });

  it("closes modal when Cancel is clicked", () => {
    render(<RateButton ratedUid="driver-99" ratedName="John Driver" journeyId="j-1" />);
    fireEvent.click(screen.getByText(/Rate this driver/));
    expect(screen.getByText(/Rate John Driver/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText(/Rate John Driver/)).toBeNull();
  });
});
