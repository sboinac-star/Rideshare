"use client";

// Replaces <input type="datetime-local"> with separate date + time inputs.
// Value format stays the same: "YYYY-MM-DDTHH:mm" (datetime-local compatible).

type Props = {
  value: string;
  onChange: (val: string) => void;
  minDate?: string; // "YYYY-MM-DD"
  minTime?: string; // "HH:mm" — only applied when selected date equals minDate
  label?: string;
  required?: boolean;
  inputClass?: string;
};

function datePart(dt: string) { return dt ? dt.substring(0, 10) : ""; }
function timePart(dt: string) { return dt ? dt.substring(11, 16) : ""; }
function combine(date: string, time: string) { return date && time ? `${date}T${time}` : ""; }

export default function DateTimePicker({ value, onChange, minDate, minTime, required, inputClass = "" }: Props) {
  const date = datePart(value);
  const time = timePart(value);
  const effectiveMinTime = date && minDate && date === minDate ? minTime : undefined;

  return (
    <div className="grid grid-cols-2 gap-2">
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
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Time</label>
        <input
          type="time"
          value={time}
          min={effectiveMinTime}
          onChange={(e) => onChange(combine(date, e.target.value))}
          className={inputClass}
          required={required && !!date}
        />
      </div>
    </div>
  );
}
