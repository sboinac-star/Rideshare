type PhotonFeature = {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
  };
};

function formatPhoton(f: PhotonFeature): { display_name: string; address: Record<string, string> } {
  const p = f.properties;
  const parts: string[] = [];

  if (p.housenumber && p.street) {
    parts.push(`${p.housenumber} ${p.street}`);
  } else if (p.street) {
    parts.push(p.street);
  } else if (p.name) {
    parts.push(p.name);
  }

  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);

  return {
    display_name: parts.join(", "),
    address: {
      house_number: p.housenumber ?? "",
      road: p.street ?? "",
      city: p.city ?? "",
      state: p.state ?? "",
      amenity: !p.street && p.name ? p.name : "",
    },
  };
}

type NominatimResult = {
  display_name: string;
  address: Record<string, string>;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 3) return Response.json([]);

  // If query starts with digits it's likely a house-number address — go straight to Nominatim
  // which has better house-number coverage than Photon. Otherwise try Photon first.
  const looksLikeAddress = /^\d/.test(q.trim());

  if (!looksLikeAddress) {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=36.37&lon=-94.21`;
      const res = await fetch(photonUrl, { headers: { "Accept-Language": "en-US,en" } });
      if (res.ok) {
        const data = await res.json();
        const features: PhotonFeature[] = (data.features ?? []).filter(
          (f: PhotonFeature) => {
            const cc = f.properties.countrycode;
            return !cc || cc.toLowerCase() === "us";
          }
        );
        const results = features.map(formatPhoton).filter((r) => r.display_name.trim().length > 0);
        if (results.length > 0) return Response.json(results);
      }
    } catch {
      // fall through to Nominatim
    }
  }

  // Nominatim for numbered addresses and fallback
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=us`;
    const res = await fetch(nomUrl, {
      headers: {
        "User-Agent": "NWARideShare/1.0 (nwa-rideshare.vercel.app)",
        "Accept-Language": "en-US,en",
        "Referer": "https://nwa-rideshare.vercel.app",
      },
    });
    if (!res.ok) return Response.json([]);
    const data: NominatimResult[] = await res.json();
    return Response.json(data);
  } catch {
    return Response.json([]);
  }
}
