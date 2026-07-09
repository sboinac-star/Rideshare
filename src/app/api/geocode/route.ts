type PhotonFeature = {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

function formatPhoton(f: PhotonFeature): { display_name: string; address: Record<string, string> } {
  const p = f.properties;
  const parts: string[] = [];
  if (p.name) parts.push(p.name);
  else if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);

  return {
    display_name: parts.join(", "),
    address: {
      house_number: p.housenumber ?? "",
      road: p.street ?? "",
      city: p.city ?? "",
      state: p.state ?? "",
      amenity: p.name && !p.street ? p.name : "",
    },
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 3) return Response.json([]);

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&layer=house&layer=street&layer=city`;

  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "en-US,en" },
    });
    if (!res.ok) return Response.json([]);
    const data = await res.json();
    const features: PhotonFeature[] = (data.features ?? []).filter(
      (f: PhotonFeature) => {
        const cc = f.properties.countrycode;
        return !cc || cc.toLowerCase() === "us";
      }
    );
    return Response.json(features.map(formatPhoton));
  } catch {
    return Response.json([]);
  }
}
