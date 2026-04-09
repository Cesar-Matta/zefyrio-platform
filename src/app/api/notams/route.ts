// SKILL: api-patterns | nextjs-best-practices
// NOTAMs API Route — Proxies FAA NOTAM API v3.0
// Free, no auth required: https://external-api.faa.gov/notamapi/v1/notams

import { NextRequest, NextResponse } from "next/server";

// Cache NOTAMs for 15 minutes (they don't change often)
const CACHE_TTL = 15 * 60 * 1000;
let cache: { data: NotamResponse; ts: number } | null = null;

interface NotamItem {
  properties: {
    notamEvent: {
      id: string;
      type: string;
      classification: string;
      location: string;
      effectiveStart: string;
      effectiveEnd: string;
      text: string;
      icaoLocation?: string;
    };
    geometry?: {
      type: string;
      coordinates: number[] | number[][][];
    };
  };
}

interface NotamResponse {
  items: NotamItem[];
  source: 'live' | 'cache' | 'error';
  fetchedAt: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "37");
  const lon = parseFloat(searchParams.get("lon") ?? "-96");
  const radius = parseFloat(searchParams.get("radius") ?? "100"); // nm

  // Return cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, source: 'cache' });
  }

  try {
    // FAA NOTAM API v3.0 — free, no API key needed
    const url = new URL("https://external-api.faa.gov/notamapi/v1/notams");
    url.searchParams.set("locationLongitude", lon.toString());
    url.searchParams.set("locationLatitude", lat.toString());
    url.searchParams.set("locationRadius", radius.toString()); // nautical miles
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("pageNum", "1");

    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`FAA API ${res.status}`);
    }

    const raw = await res.json();

    // Normalize items
    const items: NotamItem[] = (raw.items ?? []).slice(0, 30);

    const response: NotamResponse = {
      items,
      source: 'live',
      fetchedAt: Date.now(),
    };

    cache = { data: response, ts: Date.now() };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[NOTAMs API]", err);

    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ ...cache.data, source: 'cache' });
    }

    return NextResponse.json(
      { items: [], source: 'error', fetchedAt: Date.now(), error: String(err) },
      { status: 200 } // Return 200 — client handles empty gracefully
    );
  }
}
