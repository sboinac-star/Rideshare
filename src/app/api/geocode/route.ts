export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 3) return Response.json([]);

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=us`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NWARideShare/1.0 (nwa-rideshare.vercel.app)",
        "Accept-Language": "en-US,en",
        "Referer": "https://nwa-rideshare.vercel.app",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return Response.json([]);
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json([]);
  }
}
