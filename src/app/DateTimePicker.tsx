"use client";

import type { ReactNode } from "react";

// Replaces <input type="datetime-local"> with separate date + time inputs.
// Value format stays the same: "YYYY-MM-DDTHH:mm" (datetime-local compatible).
// Pass bufferHours + onBufferChange to show a third "±" column inline.

type Props = {
  value: string;
  onChange: (val: string) => void;
  minDate?: string; // "YYYY-MM-DD"
  minTime?: string; // "HH:mm" — only applied when selected date equals minDate
  label?: string;
  required?: boolean;
  inputClass?: string;
  bufferHours?: number;
  onBufferChange?: (hours: number) => void;
  append?: ReactNode; // extra column rendered inside the same grid row
};

const BUFFER_OPTIONS = [
  { value: 0.5, label: "±30m" },
  { value: 1,   label: "±1h" },
  { value: 2,   label: "±2h" },
  { value: 3,   label: "±3h" },
  { value: 4,   label: "±4h" },
];

function datePart(dt: string) { return dt ? dt.substring(0, 10) : ""; }
function timePart(dt: string) { return dt ? dt.substring(11, 16) : ""; }
function combine(date: string, time: string) { return date && time ? `${date}T${time}` : ""; }

export default function DateTimePicker({
  value, onChange, minDate, minTime, label, required, inputClass = "",
  bufferHours, onBufferChange, append,
}: Props) {
  const date = datePart(value);
  const time = timePart(value);
  const effectiveMinTime = date && minDate && date === minDate ? minTime : undefined;
  const showBuffer = onBufferChange !== undefined;
  const gridCols = showBuffer
    ? (append ? "grid-cols-4" : "grid-cols-3")
    : (append ? "grid-cols-3" : "grid-cols-2");

  return (
    <div>
      {label && <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>}
      <div className={`grid gap-2 ${gridCols}`}>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => onChange(combine(e.target.value, time || "00:00"))}
            className={inputClass}
            required={required}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Around</label>
          <input
            type="time"
            value={time}
            min={effectiveMinTime}
            onChange={(e) => onChange(combine(date, e.target.value))}
            className={inputClass}
            required={required && !!date}
          />
        </div>
        {showBuffer && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Buffer</label>
            <select
              value={bufferHours}
              onChange={(e) => onBufferChange(Number(e.target.value))}
              className={inputClass}
            >
              {BUFFER_OPTIONS.map(({ value: v, label: l }) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        )}
        {append}
      </div>
    </div>
  );
}
