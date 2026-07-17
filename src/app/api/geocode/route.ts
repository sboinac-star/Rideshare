type PhotonFeature = {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    countrycode?: string;
  };
};

function formatPhoton(f: PhotonFeature): { display_name: string; address: Record<string, string> } {
  const p = f.properties;
  const parts: string[] = [];
  if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  else if (p.name) parts.push(p.name);
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

type CensusMatch = {
  matchedAddress: string;
  addressComponents: {
    fromAddress: string;
    streetName: string;
    suffixType: string;
    city: string;
    state: string;
    zip: string;
  };
};

function formatCensus(m: CensusMatch): { display_name: string; address: Record<string, string> } {
  const c = m.addressComponents;
  const streetParts = [c.fromAddress, c.streetName, c.suffixType].filter(Boolean);
  const street = streetParts.join(" ");
  const parts = [street, c.city, c.state].filter(Boolean);
  return {
    display_name: parts.join(", "),
    address: {
      house_number: c.fromAddress ?? "",
      road: [c.streetName, c.suffixType].filter(Boolean).join(" "),
      city: c.city ?? "",
      state: c.state ?? "",
      amenity: "",
    },
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 3) return Response.json([]);

  const looksLikeAddress = /^\d/.test(q.trim());

  // For numbered queries, use US Census Geocoder (free, no key, great US coverage)
  if (looksLikeAddress) {
    try {
      const censusUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(q)}&benchmark=Public_AR_Current&format=json`;
      const res = await fetch(censusUrl);
      if (res.ok) {
        const data = await res.json();
        const matches: CensusMatch[] = data?.result?.addressMatches ?? [];
        if (matches.length > 0) {
          return Response.json(matches.slice(0, 5).map(formatCensus));
        }
      }
    } catch {
      // fall through
    }
  }

  // For place/landmark queries, use Photon (NWA-biased)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&lat=36.37&lon=-94.21`;
    const res = await fetch(photonUrl, { headers: { "Accept-Language": "en-US,en" } });
    if (res.ok) {
      const data = await res.json();
      const features: PhotonFeature[] = (data.features ?? []).filter((f: PhotonFeature) => {
        const cc = f.properties.countrycode;
        return !cc || cc.toLowerCase() === "us";
      });
      const results = features.map(formatPhoton).filter((r) => r.display_name.trim().length > 0);
      if (results.length > 0) return Response.json(results);
    }
  } catch {
    // fall through
  }

  return Response.json([]);
}
