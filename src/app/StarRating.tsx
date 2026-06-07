"use client";

import { useEffect, useState } from "react";

type Props = { uid: string };

export default function StarRating({ uid }: Props) {
  const [data, setData] = useState<{ rating: number | null; count: number } | null>(null);

  useEffect(() => {
    fetch(`/api/ratings?uid=${uid}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [uid]);

  if (!data || data.rating === null) return null;

  const stars = Math.round(data.rating);
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
      {"⭐".repeat(stars)}{"☆".repeat(5 - stars)}
      <span className="font-medium">{data.rating.toFixed(1)}</span>
      <span className="text-gray-400">({data.count})</span>
    </span>
  );
}
