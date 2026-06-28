import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import StarRating from "@/app/StarRating";

describe("StarRating", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing when rating is null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rating: null, count: 0 }) }));
    const { container } = render(<StarRating uid="driver-99" />);
    await waitFor(() => {});
    expect(container.firstChild).toBeNull();
  });

  it("renders stars and rating value", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rating: 4.2, count: 12 }) }));
    render(<StarRating uid="driver-99" />);
    await waitFor(() => expect(screen.getByText("4.2")).toBeTruthy());
    expect(screen.getByText("(12)")).toBeTruthy();
  });

  it("renders 5 stars for perfect rating", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rating: 5.0, count: 3 }) }));
    render(<StarRating uid="driver-99" />);
    await waitFor(() => expect(screen.getByText("5.0")).toBeTruthy());
  });

  it("renders nothing on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const { container } = render(<StarRating uid="driver-99" />);
    await waitFor(() => {});
    expect(container.firstChild).toBeNull();
  });

  it("fetches with correct uid", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ rating: 3.5, count: 5 }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<StarRating uid="driver-42" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/ratings?uid=driver-42"));
  });
});
