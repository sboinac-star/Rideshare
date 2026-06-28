"use client";

import { useState, useRef, useEffect } from "react";

type NominatimResult = {
  display_name: string;
  address: Record<string, string>;
};

function formatResult(r: NominatimResult): string {
  // Build a concise label: name/number + road + city (skip country/state/postcode)
  const a = r.address;
  const parts: string[] = [];
  if (a.amenity || a.shop || a.tourism || a.building || a.leisure) {
    parts.push(a.amenity ?? a.shop ?? a.tourism ?? a.building ?? a.leisure ?? "");
  } else if (a.house_number && a.road) {
    parts.push(`${a.house_number} ${a.road}`);
  } else if (a.road) {
    parts.push(a.road);
  }
  const city = a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? "";
  if (city) parts.push(city);
  if (a.state) parts.push(a.state);
  return parts.filter(Boolean).join(", ") || r.display_name.split(",").slice(0, 3).join(",").trim();
}

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  cityHint?: string;
  inputClass?: string;
  required?: boolean;
};

export default function LocationInput({ value, onChange, placeholder = "Search address…", cityHint, inputClass = "", required }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setFetching(true);
    try {
      const query = cityHint ? `${q}, ${cityHint}` : q;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en-US,en" } }
      );
      const data: NominatimResult[] = await res.json();
      const labels = [...new Set(data.map(formatResult))].slice(0, 5);
      setSuggestions(labels);
      setOpen(labels.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => search(e.target.value), 400);
        }}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder={placeholder}
        className={inputClass}
        required={required}
        autoComplete="off"
      />
      {fetching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => { onChange(s); setSuggestions([]); setOpen(false); }}
              className="px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer leading-snug border-b border-gray-50 last:border-0"
            >
              📍 {s}
            </li>
          ))}
          <li className="px-4 py-1.5 text-xs text-gray-400 text-right">
            © OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  );
}
