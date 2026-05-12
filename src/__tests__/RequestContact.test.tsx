import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RequestContact from "@/features/chat/RequestContact";

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

vi.mock("@/lib/chat", () => ({ buildChatId: vi.fn(() => "request_r1_u2") }));

const props = {
  requestId: "r1",
  ownerUid: "passenger-uid",
  passengerName: "Bob",
  route: "Fayetteville → OKC",
};

describe("RequestContact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: true });
    const { container } = render(<RequestContact {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows owner message when the signed-in user is the passenger", () => {
    mockUseAuth.mockReturnValue({ user: { uid: "passenger-uid" }, authLoading: false });
    render(<RequestContact {...props} />);
    expect(screen.getByText("This is your ride request.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the Chat button for a signed-out visitor", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: false });
    render(<RequestContact {...props} />);
    expect(screen.getByRole("button", { name: /chat with passenger/i })).toBeInTheDocument();
  });

  it("shows the Chat button for a signed-in non-owner", () => {
    mockUseAuth.mockReturnValue({ user: { uid: "driver-uid" }, authLoading: false });
    render(<RequestContact {...props} />);
    expect(screen.getByRole("button", { name: /chat with passenger/i })).toBeInTheDocument();
  });

  it("opens SignInModal when a signed-out user clicks Chat", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: false });
    render(<RequestContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with passenger/i }));
    expect(screen.getByTestId("sign-in-modal")).toBeInTheDocument();
  });

  it("opens ChatModal for a signed-in non-owner", () => {
    mockUseAuth.mockReturnValue({ user: { uid: "driver-uid", phoneNumber: "+1" }, authLoading: false });
    render(<RequestContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with passenger/i }));
    expect(screen.getByTestId("chat-modal")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Fayetteville → OKC")).toBeInTheDocument();
  });

  it("closes SignInModal when onClose is called", () => {
    mockUseAuth.mockReturnValue({ user: null, authLoading: false });
    render(<RequestContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with passenger/i }));
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("sign-in-modal")).not.toBeInTheDocument();
  });

  it("closes ChatModal when onClose is called", () => {
    mockUseAuth.mockReturnValue({ user: { uid: "driver-uid" }, authLoading: false });
    render(<RequestContact {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /chat with passenger/i }));
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("chat-modal")).not.toBeInTheDocument();
  });
});
