// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — ADS-B Proxy v3.0 (Dual Source: ADSB.lol + OpenSky)
//
// Primary:  ADSB.lol   — better global coverage, richer data, free
// Fallback: OpenSky    — well-known, good EU/US coverage
//
// Improvements over v2:
//   • Dual-source with automatic fallback
//   • Richer aircraft data (registration, aircraft type, ground speed)
//   • ADSB.lol uses radial queries — bbox converted to center + radius
//   • Per-bbox cache with stale-while-revalidate
//   • Backoff on 429 (per-source)
//   • On-ground filtering
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';

// ─── Cache config ──────────────────────────────────────────────────
const CACHE_TTL_MS      = 15_000;  // 15s
const BACKOFF_TTL_MS    = 60_000;  // 60s freeze on 429
const MAX_CACHE_ENTRIES = 50;

// ─── Types ─────────────────────────────────────────────────────────
interface NormalizedAircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lon: number;
  baroAltitude: number | null;
  geoAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
  squawk: string | null;
  category: string | number | null;
  // Enriched fields from ADSB.lol
  registration: string | null;
  aircraftType: string | null;
}

interface AdsbPayload {
  aircraft: NormalizedAircraft[];
  count: number;
  time: number;
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number };
  source: 'adsb.lol' | 'opensky' | 'merged' | 'cache';
  stale?: boolean;
  rateLimited?: boolean;
}

interface CacheEntry {
  data: AdsbPayload;
  timestamp: number;
}

const bboxCache = new Map<string, CacheEntry>();
let adsbLolBackoffUntil = 0;
let openSkyBackoffUntil = 0;

// ─── Helpers ───────────────────────────────────────────────────────

function pruneCache() {
  if (bboxCache.size <= MAX_CACHE_ENTRIES) return;
  const oldest = [...bboxCache.entries()]
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .slice(0, bboxCache.size - MAX_CACHE_ENTRIES);
  oldest.forEach(([k]) => bboxCache.delete(k));
}

function normalizeBbox(raw: string): string {
  return raw.split(',').map(v => parseFloat(v).toFixed(1)).join(',');
}

/** Convert bbox to center lat/lon and radius in nautical miles (max 250nm for ADSB.lol) */
function bboxToCenterRadius(minLat: number, minLon: number, maxLat: number, maxLon: number) {
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  // Haversine-approximate distance from center to corner in NM
  const dLat = (maxLat - minLat) / 2;
  const dLon = (maxLon - minLon) / 2;
  const a = Math.sin((dLat * Math.PI / 180) / 2) ** 2
          + Math.cos(centerLat * Math.PI / 180) * Math.cos(maxLat * Math.PI / 180)
          * Math.sin((dLon * Math.PI / 180) / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distNm = 3440.065 * c; // Earth radius in NM

  return { centerLat, centerLon, radiusNm: Math.min(Math.ceil(distNm), 250) };
}

// ─── ADSB.lol Fetcher ──────────────────────────────────────────────

interface AdsbLolAircraft {
  hex: string;
  flight?: string;
  r?: string;           // registration
  t?: string;           // aircraft ICAO type
  lat?: number;
  lon?: number;
  alt_baro?: number | string;
  alt_geom?: number;
  gs?: number;          // ground speed (knots)
  track?: number;
  baro_rate?: number;
  geom_rate?: number;
  squawk?: string;
  category?: string;
  emergency?: string;
  dbFlags?: number;
}

async function fetchFromAdsbLol(
  centerLat: number, centerLon: number, radiusNm: number
): Promise<NormalizedAircraft[] | null> {
  const now = Date.now();
  if (now < adsbLolBackoffUntil) return null;

  try {
    const url = `https://api.adsb.lol/v2/lat/${centerLat.toFixed(4)}/lon/${centerLon.toFixed(4)}/dist/${radiusNm}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status === 429) {
      adsbLolBackoffUntil = now + BACKOFF_TTL_MS;
      console.warn('[ADS-B] ADSB.lol 429 — backoff 60s');
      return null;
    }

    if (!response.ok) {
      console.warn(`[ADS-B] ADSB.lol returned ${response.status}`);
      return null;
    }

    const raw = await response.json() as { ac?: AdsbLolAircraft[]; total?: number };
    const acList = raw.ac ?? [];

    return acList
      .filter((a) => a.lat != null && a.lon != null && a.alt_baro !== 'ground')
      .map((a) => ({
        icao24:         a.hex,
        callsign:       (a.flight ?? '').trim() || a.hex,
        originCountry:  '', // ADSB.lol doesn't provide country
        lat:            a.lat!,
        lon:            a.lon!,
        baroAltitude:   typeof a.alt_baro === 'number' ? a.alt_baro * 0.3048 : null, // ft → m
        geoAltitude:    a.alt_geom != null ? a.alt_geom * 0.3048 : null,
        onGround:       a.alt_baro === 'ground',
        velocity:       a.gs != null ? a.gs * 0.514444 : null, // knots → m/s
        trueTrack:      a.track ?? null,
        verticalRate:   a.baro_rate != null ? a.baro_rate * 0.00508 : null, // fpm → m/s
        squawk:         a.squawk ?? null,
        category:       a.category ?? null,
        registration:   a.r ?? null,
        aircraftType:   a.t ?? null,
      }));
  } catch (err) {
    console.error('[ADS-B] ADSB.lol error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── OpenSky Fetcher (Fallback) ────────────────────────────────────

type OpenSkyState = [
  string, string | null, string, string | null, number,
  number | null, number | null, number | null, boolean,
  number | null, number | null, number | null, unknown,
  number | null, string | null, boolean, number, number,
];

async function fetchFromOpenSky(
  minLat: number, minLon: number, maxLat: number, maxLon: number
): Promise<NormalizedAircraft[] | null> {
  const now = Date.now();
  if (now < openSkyBackoffUntil) return null;

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 429) {
      openSkyBackoffUntil = now + BACKOFF_TTL_MS;
      console.warn('[ADS-B] OpenSky 429 — backoff 60s');
      return null;
    }

    if (!response.ok) {
      console.warn(`[ADS-B] OpenSky returned ${response.status}`);
      return null;
    }

    const raw = await response.json();
    const states: OpenSkyState[] = raw.states ?? [];

    return states
      .filter((s) => s[5] != null && s[6] != null && !s[8]) // has position, not on ground
      .map((s) => ({
        icao24:         s[0],
        callsign:       (s[1] ?? '').trim() || s[0],
        originCountry:  s[2],
        lat:            s[6] as number,
        lon:            s[5] as number,
        baroAltitude:   s[7],
        geoAltitude:    s[13],
        onGround:       s[8],
        velocity:       s[9],
        trueTrack:      s[10],
        verticalRate:   s[11],
        squawk:         s[14],
        category:       s[17],
        registration:   null,
        aircraftType:   null,
      }));
  } catch (err) {
    console.error('[ADS-B] OpenSky error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Main Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawBbox = searchParams.get('bbox');

  if (!rawBbox) {
    return NextResponse.json(
      { error: 'bbox required. Format: minLat,minLon,maxLat,maxLon' },
      { status: 400 }
    );
  }

  const parts = rawBbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json({ error: 'Invalid bbox' }, { status: 400 });
  }

  const [minLat, minLon, maxLat, maxLon] = parts;
  const cacheKey = normalizeBbox(rawBbox);
  const now = Date.now();

  // ─── Check cache ─────────────────────────────────────────────────
  const cached = bboxCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached.data, source: 'cache' as const }, {
      headers: {
        'X-Cache': 'HIT',
        'X-Cache-Age': `${Math.floor((now - cached.timestamp) / 1000)}s`,
        'Cache-Control': 'public, max-age=15',
      },
    });
  }

  // ─── Fetch from sources ──────────────────────────────────────────
  const { centerLat, centerLon, radiusNm } = bboxToCenterRadius(minLat, minLon, maxLat, maxLon);

  // Try ADSB.lol first (primary), then OpenSky as fallback
  let aircraft: NormalizedAircraft[] | null = null;
  let source: 'adsb.lol' | 'opensky' | 'merged' = 'adsb.lol';

  const adsbLolResult = await fetchFromAdsbLol(centerLat, centerLon, radiusNm);

  if (adsbLolResult && adsbLolResult.length > 0) {
    aircraft = adsbLolResult;
    source = 'adsb.lol';
  } else {
    // Fallback to OpenSky
    const openSkyResult = await fetchFromOpenSky(minLat, minLon, maxLat, maxLon);
    if (openSkyResult && openSkyResult.length > 0) {
      aircraft = openSkyResult;
      source = 'opensky';
    } else if (adsbLolResult) {
      // ADSB.lol returned empty but didn't error — genuinely no traffic
      aircraft = adsbLolResult;
      source = 'adsb.lol';
    } else if (openSkyResult) {
      aircraft = openSkyResult;
      source = 'opensky';
    }
  }

  // If both sources failed, return stale cache or error
  if (aircraft === null) {
    if (cached) {
      return NextResponse.json({ ...cached.data, stale: true, rateLimited: true }, {
        headers: { 'X-Cache': 'STALE', 'Retry-After': '60' },
      });
    }
    return NextResponse.json({
      error: 'Both ADS-B sources unavailable. Retrying shortly.',
      aircraft: [],
      count: 0,
      source: 'none',
      rateLimited: true,
    }, { status: 503 });
  }

  const payload: AdsbPayload = {
    aircraft,
    count: aircraft.length,
    time: Math.floor(now / 1000),
    bbox: { minLat, minLon, maxLat, maxLon },
    source,
  };

  bboxCache.set(cacheKey, { data: payload, timestamp: now });
  pruneCache();

  return NextResponse.json(payload, {
    headers: {
      'X-Cache': 'MISS',
      'X-Source': source,
      'Cache-Control': 'public, max-age=15',
    },
  });
}
