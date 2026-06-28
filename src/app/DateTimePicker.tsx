"use client";

// Replaces <input type="datetime-local"> with separate date + time inputs.
// Value format stays the same: "YYYY-MM-DDTHH:mm" (datetime-local compatible).
// Pass durationHours + onDurationChange to show a third "For" column inline.

type Props = {
  value: string;
  onChange: (val: string) => void;
  minDate?: string; // "YYYY-MM-DD"
  minTime?: string; // "HH:mm" — only applied when selected date equals minDate
  label?: string;
  required?: boolean;
  inputClass?: string;
  durationHours?: number;
  onDurationChange?: (hours: number) => void;
};

function datePart(dt: string) { return dt ? dt.substring(0, 10) : ""; }
function timePart(dt: string) { return dt ? dt.substring(11, 16) : ""; }
function combine(date: string, time: string) { return date && time ? `${date}T${time}` : ""; }

export default function DateTimePicker({
  value, onChange, minDate, minTime, label, required, inputClass = "",
  durationHours, onDurationChange,
}: Props) {
  const date = datePart(value);
  const time = timePart(value);
  const effectiveMinTime = date && minDate && date === minDate ? minTime : undefined;
  const showDuration = onDurationChange !== undefined;

  return (
    <div>
      {label && <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>}
      <div className={`grid gap-2 ${showDuration ? "grid-cols-3" : "grid-cols-2"}`}>
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
        {showDuration && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">For</label>
            <select
              value={durationHours}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className={inputClass}
            >
              {[1, 2, 3, 4, 6, 8].map((h) => (
                <option key={h} value={h}>+{h}h</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
