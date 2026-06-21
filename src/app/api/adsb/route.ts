// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — ADS-B Proxy v4.0 (Quad Source)
//
// Sources (queried in parallel, results merged):
//   1. ADSB.lol         — global community, richer data, free
//   2. TheAirTraffic.com— good Latam/global coverage, free
//   3. AviationStack    — commercial, good Colombia, free tier
//   4. OpenSky Network  — classic fallback, EU/US focus
//
// All non-null sources are merged and deduplicated by ICAO24.
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';

// ─── Cache config ──────────────────────────────────────────────────
const CACHE_TTL_MS      = 15_000;
const BACKOFF_TTL_MS    = 60_000;
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
  registration: string | null;
  aircraftType: string | null;
}

interface AdsbPayload {
  aircraft: NormalizedAircraft[];
  count: number;
  time: number;
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number };
  source: string;
  stale?: boolean;
  rateLimited?: boolean;
}

interface CacheEntry {
  data: AdsbPayload;
  timestamp: number;
}

const bboxCache = new Map<string, CacheEntry>();
let adsbLolBackoffUntil    = 0;
let openSkyBackoffUntil    = 0;
let airTrafficBackoffUntil = 0;
let aviationStackBackoffUntil = 0;

// AviationStack has only 100 req/month on free plan.
// Cache globally for 4 hours — called at most ~3x/day = ~90 req/month.
const AVIATIONSTACK_CACHE_MS = 4 * 60 * 60 * 1000; // 4 hours
let aviationStackCache: { aircraft: NormalizedAircraft[]; fetchedAt: number } | null = null;

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

function bboxToCenterRadius(minLat: number, minLon: number, maxLat: number, maxLon: number) {
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  const dLat = (maxLat - minLat) / 2;
  const dLon = (maxLon - minLon) / 2;
  const a = Math.sin((dLat * Math.PI / 180) / 2) ** 2
          + Math.cos(centerLat * Math.PI / 180) * Math.cos(maxLat * Math.PI / 180)
          * Math.sin((dLon * Math.PI / 180) / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distNm = 3440.065 * c;
  return { centerLat, centerLon, radiusNm: Math.min(Math.ceil(distNm), 250) };
}

/** Merge multiple source results, deduplicate by icao24, prefer richer data */
function mergeAircraft(sources: (NormalizedAircraft[] | null)[]): { aircraft: NormalizedAircraft[]; sourceNames: string[] } {
  const map = new Map<string, NormalizedAircraft>();
  const sourceNames: string[] = [];

  sources.forEach((list, idx) => {
    if (!list || list.length === 0) return;
    const names = ['adsb.lol', 'theairtraffic', 'aviationstack', 'opensky'];
    sourceNames.push(names[idx] ?? `source${idx}`);
    list.forEach(ac => {
      const key = ac.icao24.toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, ac);
      } else {
        // Merge: prefer non-null / richer values
        map.set(key, {
          ...existing,
          registration:  ac.registration  ?? existing.registration,
          aircraftType:  ac.aircraftType   ?? existing.aircraftType,
          callsign:      ac.callsign !== ac.icao24 ? ac.callsign : existing.callsign,
          originCountry: ac.originCountry || existing.originCountry,
          velocity:      ac.velocity       ?? existing.velocity,
          trueTrack:     ac.trueTrack      ?? existing.trueTrack,
          baroAltitude:  ac.baroAltitude   ?? existing.baroAltitude,
          squawk:        ac.squawk         ?? existing.squawk,
        });
      }
    });
  });

  return { aircraft: [...map.values()], sourceNames };
}

// ─── Source 1: ADSB.lol ────────────────────────────────────────────

interface AdsbLolAircraft {
  hex: string; flight?: string; r?: string; t?: string;
  lat?: number; lon?: number; alt_baro?: number | string; alt_geom?: number;
  gs?: number; track?: number; baro_rate?: number; squawk?: string; category?: string;
}

async function fetchFromAdsbLol(centerLat: number, centerLon: number, radiusNm: number): Promise<NormalizedAircraft[] | null> {
  const now = Date.now();
  if (now < adsbLolBackoffUntil) return null;
  try {
    const url = `https://api.adsb.lol/v2/lat/${centerLat.toFixed(4)}/lon/${centerLon.toFixed(4)}/dist/${radiusNm}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8_000) });
    if (response.status === 429) { adsbLolBackoffUntil = now + BACKOFF_TTL_MS; return null; }
    if (!response.ok) return null;
    const raw = await response.json() as { ac?: AdsbLolAircraft[] };
    return (raw.ac ?? [])
      .filter(a => a.lat != null && a.lon != null && a.alt_baro !== 'ground')
      .map(a => ({
        icao24: a.hex, callsign: (a.flight ?? '').trim() || a.hex, originCountry: '',
        lat: a.lat!, lon: a.lon!,
        baroAltitude: typeof a.alt_baro === 'number' ? a.alt_baro * 0.3048 : null,
        geoAltitude:  a.alt_geom != null ? a.alt_geom * 0.3048 : null,
        onGround: false, velocity: a.gs != null ? a.gs * 0.514444 : null,
        trueTrack: a.track ?? null, verticalRate: a.baro_rate != null ? a.baro_rate * 0.00508 : null,
        squawk: a.squawk ?? null, category: a.category ?? null, registration: a.r ?? null, aircraftType: a.t ?? null,
      }));
  } catch { return null; }
}

// ─── Source 2: TheAirTraffic.com ───────────────────────────────────

async function fetchFromTheAirTraffic(minLat: number, minLon: number, maxLat: number, maxLon: number): Promise<NormalizedAircraft[] | null> {
  const now = Date.now();
  if (now < airTrafficBackoffUntil) return null;
  try {
    const url = `https://api.theairtraffic.com/api/aclist?south=${minLat}&west=${minLon}&north=${maxLat}&east=${maxLon}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8_000) });
    if (response.status === 429) { airTrafficBackoffUntil = now + BACKOFF_TTL_MS; return null; }
    if (!response.ok) return null;
    const raw = await response.json() as any[];
    if (!Array.isArray(raw)) return null;
    return raw
      .filter(a => a.lat != null && a.lng != null && !a.onGround)
      .map(a => ({
        icao24: (a.icao ?? a.hex ?? '').toLowerCase(),
        callsign: (a.callsign ?? a.flight ?? '').trim() || a.icao,
        originCountry: a.country ?? '',
        lat: a.lat, lon: a.lng,
        baroAltitude: a.altitude != null ? a.altitude * 0.3048 : null,
        geoAltitude: null, onGround: false,
        velocity: a.speed != null ? a.speed * 0.514444 : null,
        trueTrack: a.heading ?? null, verticalRate: null,
        squawk: a.squawk ?? null, category: null,
        registration: a.registration ?? null, aircraftType: a.type ?? null,
      }));
  } catch { return null; }
}

// ─── Source 3: AviationStack ───────────────────────────────────────

async function fetchFromAviationStack(minLat: number, minLon: number, maxLat: number, maxLon: number): Promise<NormalizedAircraft[] | null> {
  const now = Date.now();
  if (now < aviationStackBackoffUntil) return null;
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) return null;

  // Return cached global data filtered to bbox — avoids burning quota on every map move
  if (aviationStackCache && (now - aviationStackCache.fetchedAt) < AVIATIONSTACK_CACHE_MS) {
    return aviationStackCache.aircraft.filter(a =>
      a.lat >= minLat && a.lat <= maxLat && a.lon >= minLon && a.lon <= maxLon
    );
  }

  try {
    console.log('[ADS-B] AviationStack — making API call (cached 4h)');
    // Free plan only supports HTTP and returns up to 100 global flights
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&limit=100&flight_status=active`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10_000) });
    if (response.status === 429) { aviationStackBackoffUntil = now + BACKOFF_TTL_MS; return null; }
    if (!response.ok) { console.warn(`[ADS-B] AviationStack ${response.status}`); return null; }

    const raw = await response.json() as { data?: any[] };
    const flights = raw.data ?? [];

    const allAircraft: NormalizedAircraft[] = flights
      .filter((f: any) => {
        const live = f.live;
        return live && live.latitude != null && live.longitude != null && !live.is_ground;
      })
      .map((f: any) => ({
        icao24: (f.aircraft?.icao24 ?? f.flight?.icao ?? '').toLowerCase(),
        callsign: f.flight?.icao ?? f.flight?.iata ?? '',
        originCountry: f.airline?.country_name ?? '',
        lat: f.live.latitude, lon: f.live.longitude,
        baroAltitude: f.live.altitude ?? null,
        geoAltitude: null, onGround: false,
        velocity: f.live.speed_horizontal != null ? f.live.speed_horizontal / 3.6 : null,
        trueTrack: f.live.direction ?? null, verticalRate: f.live.speed_vertical ?? null,
        squawk: null, category: null,
        registration: f.aircraft?.registration ?? null,
        aircraftType: f.aircraft?.iata ?? null,
      }))
      .filter((a: NormalizedAircraft) => a.icao24);

    // Store globally with timestamp
    aviationStackCache = { aircraft: allAircraft, fetchedAt: now };

    return allAircraft.filter(a =>
      a.lat >= minLat && a.lat <= maxLat && a.lon >= minLon && a.lon <= maxLon
    );
  } catch (err) {
    console.error('[ADS-B] AviationStack error:', err);
    return null;
  }
}

// ─── Source 4: OpenSky ─────────────────────────────────────────────

type OpenSkyState = [
  string, string | null, string, string | null, number,
  number | null, number | null, number | null, boolean,
  number | null, number | null, number | null, unknown,
  number | null, string | null, boolean, number, number,
];

async function fetchFromOpenSky(minLat: number, minLon: number, maxLat: number, maxLon: number): Promise<NormalizedAircraft[] | null> {
  const now = Date.now();
  if (now < openSkyBackoffUntil) return null;
  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10_000) });
    if (response.status === 429) { openSkyBackoffUntil = now + BACKOFF_TTL_MS; return null; }
    if (!response.ok) return null;
    const raw = await response.json();
    const states: OpenSkyState[] = raw.states ?? [];
    return states
      .filter(s => s[5] != null && s[6] != null && !s[8])
      .map(s => ({
        icao24: s[0], callsign: (s[1] ?? '').trim() || s[0], originCountry: s[2],
        lat: s[6] as number, lon: s[5] as number,
        baroAltitude: s[7], geoAltitude: s[13], onGround: s[8],
        velocity: s[9], trueTrack: s[10], verticalRate: s[11], squawk: s[14],
        category: s[17], registration: null, aircraftType: null,
      }));
  } catch { return null; }
}

// ─── Main Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawBbox = searchParams.get('bbox');

  if (!rawBbox) {
    return NextResponse.json({ error: 'bbox required. Format: minLat,minLon,maxLat,maxLon' }, { status: 400 });
  }

  const parts = rawBbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json({ error: 'Invalid bbox' }, { status: 400 });
  }

  const [minLat, minLon, maxLat, maxLon] = parts;
  const cacheKey = normalizeBbox(rawBbox);
  const now = Date.now();

  // ─── Cache check ─────────────────────────────────────────────────
  const cached = bboxCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached.data, source: 'cache' }, {
      headers: { 'X-Cache': 'HIT', 'X-Cache-Age': `${Math.floor((now - cached.timestamp) / 1000)}s`, 'Cache-Control': 'public, max-age=15' },
    });
  }

  // ─── Fetch ALL sources in parallel ───────────────────────────────
  const { centerLat, centerLon, radiusNm } = bboxToCenterRadius(minLat, minLon, maxLat, maxLon);

  const [adsbLolResult, airTrafficResult, aviationStackResult, openSkyResult] = await Promise.all([
    fetchFromAdsbLol(centerLat, centerLon, radiusNm),
    fetchFromTheAirTraffic(minLat, minLon, maxLat, maxLon),
    fetchFromAviationStack(minLat, minLon, maxLat, maxLon),
    fetchFromOpenSky(minLat, minLon, maxLat, maxLon),
  ]);

  // ─── Merge results ───────────────────────────────────────────────
  const { aircraft, sourceNames } = mergeAircraft([adsbLolResult, airTrafficResult, aviationStackResult, openSkyResult]);

  if (aircraft.length === 0 && sourceNames.length === 0) {
    if (cached) {
      return NextResponse.json({ ...cached.data, stale: true, rateLimited: true }, {
        headers: { 'X-Cache': 'STALE', 'Retry-After': '60' },
      });
    }
    return NextResponse.json({
      error: 'Todas las fuentes ADS-B no disponibles. Reintentando pronto.',
      aircraft: [], count: 0, source: 'none', rateLimited: true,
    }, { status: 503 });
  }

  const source = sourceNames.join('+') || 'empty';
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
    headers: { 'X-Cache': 'MISS', 'X-Source': source, 'Cache-Control': 'public, max-age=15' },
  });
}
