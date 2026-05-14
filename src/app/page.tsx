import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { Journey } from "@/lib/types";
import { parseValue, FirestoreValue } from "@/lib/firestore";

export const metadata: Metadata = {
  openGraph: { url: "/" },
};

async function fetchInitialJourneys(): Promise<Journey[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return [];

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "journeys" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "active" },
              },
            },
          },
        }),
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return [];

    const rows = (await res.json()) as Array<{
      document?: {
        name: string;
        fields: Record<string, FirestoreValue>;
      };
    }>;

    const now = new Date();
    return rows
      .filter((row) => row.document)
      .map((row) => {
        const doc = row.document!;
        const id = doc.name.split("/").pop()!;
        const f = doc.fields;
        return {
          id,
          driverName: String(parseValue(f.driverName) ?? ""),
          from: String(parseValue(f.from) ?? ""),
          to: String(parseValue(f.to) ?? ""),
          pickupAddress: f.pickupAddress ? String(parseValue(f.pickupAddress)) : undefined,
          dropoffAddress: f.dropoffAddress ? String(parseValue(f.dropoffAddress)) : undefined,
          departureTime: String(parseValue(f.departureTime) ?? ""),
          availableSeats: Number(parseValue(f.availableSeats) ?? 0),
          driverPhone: String(parseValue(f.driverPhone) ?? ""),
          status: String(parseValue(f.status) ?? ""),
          roundTrip: f.roundTrip ? Boolean(parseValue(f.roundTrip)) : undefined,
        } as Journey;
      })
      .filter((j) => new Date(j.departureTime) > now)
      .sort((a, b) => (a.departureTime > b.departureTime ? 1 : -1));
  } catch {
    return [];
  }
}

export default async function Home() {
  const initialJourneys = await fetchInitialJourneys();
  return <HomeClient initialJourneys={initialJourneys} />;
}
