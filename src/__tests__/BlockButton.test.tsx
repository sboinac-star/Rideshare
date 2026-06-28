import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import BlockButton from "@/app/BlockButton";

const mockToast = vi.fn();
vi.mock("@/app/ToastProvider", () => ({ useToast: () => mockToast }));

const mockGetIdToken = vi.fn().mockResolvedValue("tok-999");
const mockUser = { uid: "user-1", getIdToken: mockGetIdToken };
let currentUser: typeof mockUser | null = mockUser;

vi.mock("@/app/AuthProvider", () => ({
  useAuth: () => ({ user: currentUser }),
}));

describe("BlockButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
    mockGetIdToken.mockResolvedValue("tok-999");
  });

  it("renders nothing when user is the same as blockedUid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve({ blocked: false }) }));
    const { container } = render(<BlockButton blockedUid="user-1" blockedName="Self" />);
    // same uid → component returns null immediately
    expect(container.firstChild).toBeNull();
  });

  it("shows Block button when not blocked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve({ blocked: false }) }));
    render(<BlockButton blockedUid="user-2" blockedName="Alice" />);
    await waitFor(() => expect(screen.getByText("Block")).toBeTruthy());
  });

  it("shows Unblock button when already blocked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve({ blocked: true }) }));
    render(<BlockButton blockedUid="user-2" blockedName="Alice" />);
    await waitFor(() => expect(screen.getByText("Unblock")).toBeTruthy());
  });

  it("toggles block on click and shows toast", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ blocked: false }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ blocked: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<BlockButton blockedUid="user-2" blockedName="Alice" />);
    await waitFor(() => screen.getByText("Block"));
    fireEvent.click(screen.getByText("Block"));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Alice has been blocked."));
    expect(screen.getByText("Unblock")).toBeTruthy();
  });

  it("toggles unblock on click and shows toast", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ blocked: true }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ blocked: false }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<BlockButton blockedUid="user-2" blockedName="Alice" />);
    await waitFor(() => screen.getByText("Unblock"));
    fireEvent.click(screen.getByText("Unblock"));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Alice has been unblocked."));
    expect(screen.getByText("Block")).toBeTruthy();
  });

  it("shows error toast when toggle fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ blocked: false }) })
      .mockRejectedValueOnce(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    render(<BlockButton blockedUid="user-2" blockedName="Alice" />);
    await waitFor(() => screen.getByText("Block"));
    fireEvent.click(screen.getByText("Block"));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith("Something went wrong.", "error"));
  });

  it("renders nothing when user is null", () => {
    currentUser = null;
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(<BlockButton blockedUid="user-2" blockedName="Alice" />);
    expect(container.firstChild).toBeNull();
  });
});
