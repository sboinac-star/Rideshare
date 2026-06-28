import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import DateTimePicker from "@/app/DateTimePicker";

describe("DateTimePicker", () => {
  it("renders date and time inputs without duration", () => {
    render(<DateTimePicker value="" onChange={() => {}} />);
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="time"]')).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders duration dropdown when onDurationChange is provided", () => {
    render(
      <DateTimePicker
        value=""
        onChange={() => {}}
        durationHours={2}
        onDurationChange={() => {}}
      />
    );
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("+1h")).toBeInTheDocument();
    expect(screen.getByText("+2h")).toBeInTheDocument();
    expect(screen.getByText("+4h")).toBeInTheDocument();
    expect(screen.getByText("+8h")).toBeInTheDocument();
  });

  it("shows 'For' label above duration dropdown", () => {
    render(
      <DateTimePicker
        value=""
        onChange={() => {}}
        durationHours={2}
        onDurationChange={() => {}}
      />
    );
    expect(screen.getByText("For")).toBeInTheDocument();
  });

  it("duration dropdown reflects durationHours prop", () => {
    render(
      <DateTimePicker
        value=""
        onChange={() => {}}
        durationHours={4}
        onDurationChange={() => {}}
      />
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("4");
  });

  it("calls onDurationChange when duration is changed", () => {
    const onDurationChange = vi.fn();
    render(
      <DateTimePicker
        value=""
        onChange={() => {}}
        durationHours={2}
        onDurationChange={onDurationChange}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "3" } });
    expect(onDurationChange).toHaveBeenCalledWith(3);
  });

  it("duration dropdown renders in same row as date and time (3-col grid)", () => {
    const { container } = render(
      <DateTimePicker
        value=""
        onChange={() => {}}
        durationHours={2}
        onDurationChange={() => {}}
      />
    );
    const grid = container.querySelector(".grid-cols-3");
    expect(grid).toBeInTheDocument();
  });
});

import { vi } from "vitest";
