// SIGMET/AIRMET API Route — Proxies AWC (Aviation Weather Center)
// Source: https://aviationweather.gov/api/data/airsigmet
// Free, no auth required

import { NextRequest, NextResponse } from 'next/server';

// Cache SIGMETs for 10 minutes
const CACHE_TTL = 10 * 60 * 1000;
let cache: { data: SigmetResponse; ts: number } | null = null;

interface SigmetItem {
  airSigmetId: number;
  icaoId: string;
  airSigmetType: string; // 'SIGMET' | 'AIRMET' | 'CWA'
  hazard: string;        // 'TURB' | 'ICE' | 'IFR' | 'MTN OBSCN' | 'TS' | 'CONVECTIVE'
  severity: string;      // 'SEV' | 'MOD' | 'LGT'
  altitudeLo: number;    // feet MSL
  altitudeHi: number;    // feet MSL
  rawAirSigmet: string;  // Raw text
  validTimeFrom: string;
  validTimeTo: string;
  coords?: { lat: number; lon: number }[];
}

interface SigmetResponse {
  items: SigmetItem[];
  source: 'live' | 'cache' | 'error';
  fetchedAt: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '37');
  const lon = parseFloat(searchParams.get('lon') ?? '-96');

  // Return cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, source: 'cache' });
  }

  try {
    // AWC SIGMET/AIRMET API — bbox-based query
    const delta = 3; // ~3 degrees (~330km) radius
    const minLat = (lat - delta).toFixed(2);
    const maxLat = (lat + delta).toFixed(2);
    const minLon = (lon - delta).toFixed(2);
    const maxLon = (lon + delta).toFixed(2);

    const url = `https://aviationweather.gov/api/data/airsigmet?format=json&bbox=${minLat},${minLon},${maxLat},${maxLon}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`AWC API responded ${res.status}`);
    }

    const raw = await res.json();

    // Normalize items from AWC response
    const items: SigmetItem[] = (Array.isArray(raw) ? raw : []).slice(0, 30).map((item: Partial<SigmetItem>) => ({
      airSigmetId: item.airSigmetId ?? 0,
      icaoId: item.icaoId ?? '',
      airSigmetType: item.airSigmetType ?? 'SIGMET',
      hazard: item.hazard ?? 'UNKNOWN',
      severity: item.severity ?? '',
      altitudeLo: item.altitudeLo ?? 0,
      altitudeHi: item.altitudeHi ?? 45000,
      rawAirSigmet: item.rawAirSigmet ?? '',
      validTimeFrom: item.validTimeFrom ?? '',
      validTimeTo: item.validTimeTo ?? '',
      coords: item.coords ?? [],
    }));

    const response: SigmetResponse = {
      items,
      source: 'live',
      fetchedAt: Date.now(),
    };

    cache = { data: response, ts: Date.now() };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[SIGMET API]', err);

    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ ...cache.data, source: 'cache' });
    }

    return NextResponse.json(
      { items: [], source: 'error', fetchedAt: Date.now(), error: String(err) },
      { status: 200 } // 200 so client handles gracefully
    );
  }
}
