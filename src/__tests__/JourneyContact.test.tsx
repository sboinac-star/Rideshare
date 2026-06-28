import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyContact from "@/features/chat/JourneyContact";

const mockUseAuth = vi.fn();
vi.mock("@/app/AuthProvider", () => ({ useAuth: () => mockUseAuth() }));

vi.mock("@/app/SignInModal", () => ({
  default: ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => (
    <div data-testid="sign-in-modal">
      <button onClick={onClose}>Close</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  ),
}));

vi.mock("@/features/chat/ChatModal", () => ({
  default: ({ onClose, ownerName, route }: { onClose: () => void; ownerName: string; route: string }) => (
    <div data-testid="chat-modal">
      <span>{ownerName}</span>
      <span>{route}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("@/lib/chat", () => ({ buildChatId: vi.fn(() => "journey_j1_u2") }));

const mockUser = (uid: string) => ({
  uid,
  phoneNumber: "+1",
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
});

// Block check returns not-blocked by default
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ blocked: false }),
}));

const props = {
  journeyId: "j1",
  ownerUid: "driver-uid",
  driverName: "Alice",
  route: "Bentonville → Dallas",
};

describe("JourneyContact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: true });
    const { container } = render(<JourneyContact {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows owner message when the signed-in user is the driver", () => {
    mockUseAuth.mockReturnValue({ user: mockUser("driver-uid"), authLoading: false });
    render(<JourneyContact {...props} />);
    expect(screen.getByText("This is your journey.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the Chat button for a signed-out visitor", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: false });
    render(<JourneyContact {...props} />);
    expect(screen.getByRole("button", { name: /chat with driver/i })).toBeInTheDocument();
  });

  it("shows the Chat button for a signed-in non-owner", () => {
    mockUseAuth.mockReturnValue({ user: mockUser("other-uid"), authLoading: false });
    render(<JourneyContact {...props} />);
    expect(screen.getByRole("button", { name: /chat with driver/i })).toBeInTheDocument();
  });

  it("opens SignInModal when a signed-out user clicks Chat", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: false });
    render(<JourneyContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with driver/i }));
    expect(screen.getByTestId("sign-in-modal")).toBeInTheDocument();
  });

  it("opens ChatModal directly when a signed-in user clicks Chat", () => {
    mockUseAuth.mockReturnValue({ user: mockUser("other-uid"), authLoading: false });
    render(<JourneyContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with driver/i }));
    expect(screen.getByTestId("chat-modal")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bentonville → Dallas")).toBeInTheDocument();
  });

  it("passes onSuccess from SignInModal to open ChatModal after sign-in", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: false });
    render(<JourneyContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with driver/i }));
    fireEvent.click(screen.getByText("Success"));
    expect(screen.getByTestId("sign-in-modal")).toBeInTheDocument();
  });

  it("closes SignInModal when onClose is called", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: false });
    render(<JourneyContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with driver/i }));
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("sign-in-modal")).not.toBeInTheDocument();
  });

  it("closes ChatModal when onClose is called", () => {
    mockUseAuth.mockReturnValue({ user: mockUser("other-uid"), authLoading: false });
    render(<JourneyContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with driver/i }));
    expect(screen.getByTestId("chat-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("chat-modal")).not.toBeInTheDocument();
  });

  it("shows blocked message when user has blocked the driver", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ blocked: true }),
    }));
    mockUseAuth.mockReturnValue({ user: mockUser("other-uid"), authLoading: false });
    render(<JourneyContact {...props} />);
    await screen.findByText(/you have blocked this driver/i);
    expect(screen.queryByRole("button", { name: /chat with driver/i })).not.toBeInTheDocument();
  });
});
