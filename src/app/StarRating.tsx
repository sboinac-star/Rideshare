"use client";

import { useEffect, useState } from "react";

type Props = { uid: string };

export default function StarRating({ uid }: Props) {
  const [data, setData] = useState<{ rating: number | null; count: number; cancelCount: number; completedCount: number } | null>(null);

  useEffect(() => {
    fetch(`/api/ratings?uid=${uid}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [uid]);

  if (!data) return null;

  const isLowRating = data.rating !== null && data.count >= 3 && data.rating < 3;
  const highCancels = (data.cancelCount ?? 0) >= 3;
  const completedCount = data.completedCount ?? 0;

  if (data.rating === null && !highCancels && completedCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {data.rating !== null && (
        isLowRating ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200" title="Low rating — use caution">
            ⚠️ {data.rating.toFixed(1)} ({data.count})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            {"⭐".repeat(Math.round(data.rating))}{"☆".repeat(5 - Math.round(data.rating))}
            <span className="font-medium">{data.rating.toFixed(1)}</span>
            <span className="text-gray-400">({data.count})</span>
          </span>
        )
      )}
      {completedCount > 0 && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-200" title="Completed rides">
          🚗 {completedCount} ride{completedCount !== 1 ? "s" : ""}
        </span>
      )}
      {highCancels && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full border border-orange-200" title="This user has cancelled multiple rides">
          ⚠️ {data.cancelCount} cancellations
        </span>
      )}
    </span>
  );
}
