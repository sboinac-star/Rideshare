import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatModal from "@/features/chat/ChatModal";

const mockUseAuth = vi.fn();
vi.mock("@/app/AuthProvider", () => ({ useAuth: () => mockUseAuth() }));

const mockGetOrCreateChat = vi.fn();
const mockSendMessage = vi.fn();
const mockSubscribeToMessages = vi.fn();
const mockLookupUserName = vi.fn();

vi.mock("@/lib/chat", () => ({
  getOrCreateChat: (...a: unknown[]) => mockGetOrCreateChat(...a),
  sendMessage: (...a: unknown[]) => mockSendMessage(...a),
  subscribeToMessages: (...a: unknown[]) => mockSubscribeToMessages(...a),
  lookupUserName: (...a: unknown[]) => mockLookupUserName(...a),
}));

const defaultProps = {
  chatId: "journey_j1_u1",
  ownerUid: "driver-uid",
  ownerName: "Alice",
  route: "Bentonville → Dallas",
  listingType: "journey" as const,
  listingId: "j1",
  onClose: vi.fn(),
};

describe("ChatModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateChat.mockResolvedValue(undefined);
    mockSendMessage.mockResolvedValue(undefined);
    mockLookupUserName.mockResolvedValue("Priya Sharma");
    mockSubscribeToMessages.mockImplementation((_id: string, cb: (msgs: unknown[]) => void) => {
      cb([]);
      return vi.fn();
    });
    mockUseAuth.mockReturnValue({ user: { uid: "u1", phoneNumber: "+14795550000", getIdToken: vi.fn().mockResolvedValue("tok") } });
  });

  it("renders owner name and route in the header", () => {
    render(<ChatModal {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bentonville → Dallas")).toBeInTheDocument();
  });

  it("shows a loading spinner before chat is ready", () => {
    mockGetOrCreateChat.mockImplementation(() => new Promise(() => {}));
    render(<ChatModal {...defaultProps} />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("disables the input while connecting", () => {
    mockGetOrCreateChat.mockImplementation(() => new Promise(() => {}));
    render(<ChatModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/connecting/i)).toBeDisabled();
  });

  it("shows 'No messages yet' when chat is ready and empty", async () => {
    render(<ChatModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });
  });

  it("enables input after chat doc is ready", async () => {
    render(<ChatModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).not.toBeDisabled();
    });
  });

  it("renders received messages on the left and sent messages on the right", async () => {
    mockSubscribeToMessages.mockImplementation((_id: string, cb: (msgs: unknown[]) => void) => {
      cb([
        { id: "1", uid: "u1", senderName: "+1", text: "My message", createdAt: null },
        { id: "2", uid: "driver-uid", senderName: "Alice", text: "Their reply", createdAt: null },
      ]);
      return vi.fn();
    });

    render(<ChatModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("My message")).toBeInTheDocument();
      expect(screen.getByText("Their reply")).toBeInTheDocument();
    });

    const myBubble = screen.getByText("My message").closest("div")!;
    const theirBubble = screen.getByText("Their reply").closest("div")!;
    expect(myBubble.className).toContain("bg-blue-600");
    expect(theirBubble.className).toContain("bg-gray-100");
  });

  it("keeps the send button disabled when input is empty", async () => {
    render(<ChatModal {...defaultProps} />);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));
    expect(screen.getByLabelText("Send")).toBeDisabled();
  });

  it("enables the send button when input has text", async () => {
    render(<ChatModal {...defaultProps} />);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));
    fireEvent.change(screen.getByPlaceholderText(/type a message/i), { target: { value: "Hi!" } });
    expect(screen.getByLabelText("Send")).not.toBeDisabled();
  });

  it("calls sendMessage and clears input on Enter", async () => {
    render(<ChatModal {...defaultProps} />);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: "Hello!" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        "journey_j1_u1",
        "u1",
        "Priya Sharma",
        "Hello!",
      );
    });
  });

  it("does not send on Shift+Enter", async () => {
    render(<ChatModal {...defaultProps} />);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: "Hi" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("calls onClose when the back button is clicked", () => {
    render(<ChatModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("shows 'Passenger' as the header name when the user is the owner", async () => {
    mockUseAuth.mockReturnValue({ user: { uid: "driver-uid", phoneNumber: "+1", getIdToken: vi.fn().mockResolvedValue("tok") } });
    render(<ChatModal {...defaultProps} />);
    expect(screen.getByText("Passenger")).toBeInTheDocument();
  });

  it("does not render when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<ChatModal {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument(); // header still renders
    expect(mockGetOrCreateChat).not.toHaveBeenCalled();
  });
});
