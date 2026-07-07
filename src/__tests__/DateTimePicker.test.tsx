import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import DateTimePicker from "@/app/DateTimePicker";

describe("DateTimePicker", () => {
  const baseProps = {
    value: "2026-06-30T09:00",
    onChange: vi.fn(),
  };

  it("renders date and time inputs", () => {
    render(<DateTimePicker {...baseProps} />);
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="time"]')).toBeInTheDocument();
  });

  it("does not render buffer select by default", () => {
    render(<DateTimePicker {...baseProps} />);
    const selects = screen.queryAllByRole("combobox");
    const bufferSelect = selects.find((s) =>
      Array.from(s.querySelectorAll("option")).some((o) => o.textContent?.includes("±"))
    );
    expect(bufferSelect).toBeUndefined();
  });

  it("renders buffer select when onBufferChange is provided", () => {
    render(<DateTimePicker {...baseProps} bufferHours={1} onBufferChange={vi.fn()} />);
    const selects = screen.getAllByRole("combobox");
    const bufferSelect = selects.find((s) =>
      Array.from(s.querySelectorAll("option")).some((o) => o.textContent?.includes("±"))
    );
    expect(bufferSelect).toBeDefined();
  });

  it("buffer select has all 5 options (±30m, ±1h, ±2h, ±3h, ±4h)", () => {
    render(<DateTimePicker {...baseProps} bufferHours={1} onBufferChange={vi.fn()} />);
    const selects = screen.getAllByRole("combobox");
    const bufferSelect = selects.find((s) =>
      Array.from(s.querySelectorAll("option")).some((o) => o.textContent?.includes("±"))
    )!;
    const options = Array.from(bufferSelect.querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toContain("±30m");
    expect(options).toContain("±1h");
    expect(options).toContain("±2h");
    expect(options).toContain("±3h");
    expect(options).toContain("±4h");
  });

  it("calls onBufferChange when buffer select changes", () => {
    const onBufferChange = vi.fn();
    render(<DateTimePicker {...baseProps} bufferHours={1} onBufferChange={onBufferChange} />);
    const selects = screen.getAllByRole("combobox");
    const bufferSelect = selects.find((s) =>
      Array.from(s.querySelectorAll("option")).some((o) => o.textContent?.includes("±"))
    )!;
    fireEvent.change(bufferSelect, { target: { value: "2" } });
    expect(onBufferChange).toHaveBeenCalledWith(2);
  });

  it("calls onChange with combined datetime when date changes", () => {
    const onChange = vi.fn();
    render(<DateTimePicker {...baseProps} onChange={onChange} />);
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-07-01" } });
    expect(onChange).toHaveBeenCalledWith("2026-07-01T09:00");
  });

  it("calls onChange with combined datetime when time changes", () => {
    const onChange = vi.fn();
    render(<DateTimePicker {...baseProps} onChange={onChange} />);
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: "14:30" } });
    expect(onChange).toHaveBeenCalledWith("2026-06-30T14:30");
  });

  it("shows 'Around' label for time column when buffer is present", () => {
    render(<DateTimePicker {...baseProps} bufferHours={1} onBufferChange={vi.fn()} />);
    expect(screen.getByText("Around")).toBeInTheDocument();
  });

  it("shows 'Buffer' label when buffer is present", () => {
    render(<DateTimePicker {...baseProps} bufferHours={1} onBufferChange={vi.fn()} />);
    expect(screen.getByText("Buffer")).toBeInTheDocument();
  });

  it("uses 3-column grid when buffer is shown", () => {
    const { container } = render(
      <DateTimePicker {...baseProps} bufferHours={1} onBufferChange={vi.fn()} />
    );
    expect(container.querySelector(".grid-cols-3")).toBeInTheDocument();
  });

  it("uses 2-column grid when no buffer", () => {
    const { container } = render(<DateTimePicker {...baseProps} />);
    expect(container.querySelector(".grid-cols-2")).toBeInTheDocument();
  });

  it("uses 4-column grid when buffer and append are both present", () => {
    const { container } = render(
      <DateTimePicker
        {...baseProps}
        bufferHours={1}
        onBufferChange={vi.fn()}
        append={<div>Extra</div>}
      />
    );
    expect(container.querySelector(".grid-cols-4")).toBeInTheDocument();
  });

  it("renders optional label above the grid", () => {
    render(<DateTimePicker {...baseProps} label="Departure Time" />);
    expect(screen.getByText("Departure Time")).toBeInTheDocument();
  });

  it("renders append node inside the grid", () => {
    render(<DateTimePicker {...baseProps} append={<div>Extra Column</div>} />);
    expect(screen.getByText("Extra Column")).toBeInTheDocument();
  });
});
