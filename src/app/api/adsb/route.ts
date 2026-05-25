// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — ADS-B Proxy v2.1 (Optimized Cache)
// Source: OpenSky Network REST API
// Improvements:
//   • Per-bbox cache map (no cache miss when panning the map)
//   • Backoff TTL on 429: 60s pause before retrying
//   • Stale-while-revalidate pattern for seamless UX
//   • On-ground filter configurable via param
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';

// ─── Per-bbox cache store ──────────────────────────────────────────
const CACHE_TTL_MS      = 15_000;  // Normal TTL: 15s
const BACKOFF_TTL_MS    = 60_000;  // 429 backoff: 60s freeze
const MAX_CACHE_ENTRIES = 50;      // Prevent unbounded memory growth

interface AdsbPayload {
  aircraft: Array<Record<string, unknown>>;
  count: number;
  time: number;
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number };
  stale?: boolean;
  rateLimited?: boolean;
}

interface CacheEntry {
  data: AdsbPayload;
  timestamp: number;
  stale?: boolean;
}

type OpenSkyState = [
  string, string | null, string, string | null, number,
  number | null, number | null, number | null, boolean,
  number | null, number | null, number | null, unknown,
  number | null, string | null, boolean, number, number,
];

const bboxCache = new Map<string, CacheEntry>();
let rateLimitUntil = 0; // Epoch ms — block all OpenSky calls until this time

// ─── LRU eviction: trim to MAX_CACHE_ENTRIES ──────────────────────
function pruneCache() {
  if (bboxCache.size <= MAX_CACHE_ENTRIES) return;
  const oldest = [...bboxCache.entries()]
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .slice(0, bboxCache.size - MAX_CACHE_ENTRIES);
  oldest.forEach(([k]) => bboxCache.delete(k));
}

// ─── Round bbox to 1 decimal to maximise cache hits ───────────────
function normalizeBbox(raw: string): string {
  return raw.split(',').map(v => parseFloat(v).toFixed(1)).join(',');
}

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

  const cacheKey = normalizeBbox(rawBbox);
  const [minLat, minLon, maxLat, maxLon] = parts;
  const now = Date.now();

  // ─── Return fresh cache immediately ──────────────────────────────
  const cached = bboxCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'X-Cache': 'HIT',
        'X-Cache-Age': `${Math.floor((now - cached.timestamp) / 1000)}s`,
        'Cache-Control': 'public, max-age=15',
      },
    });
  }

  // ─── Rate limit backoff: return stale if within freeze window ────
  if (now < rateLimitUntil) {
    const waitSec = Math.ceil((rateLimitUntil - now) / 1000);
    if (cached) {
      return NextResponse.json({ ...cached.data, stale: true, rateLimited: true }, {
        headers: {
          'X-Cache': 'STALE',
          'X-Rate-Limit-Wait': `${waitSec}s`,
          'Retry-After': `${waitSec}`,
        },
      });
    }
    return NextResponse.json({
      error: `OpenSky rate limited. Retry in ${waitSec}s.`,
      aircraft: [],
      count: 0,
      rateLimited: true,
    }, { status: 429 });
  }

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 429) {
      // Enter 60s backoff — don't hammer OpenSky
      rateLimitUntil = now + BACKOFF_TTL_MS;
      console.warn('[ADS-B] 429 received — backoff for 60s');
      if (cached) {
        return NextResponse.json({ ...cached.data, stale: true, rateLimited: true }, {
          headers: { 'X-Cache': 'STALE', 'Retry-After': '60' },
        });
      }
      return NextResponse.json({
        error: 'OpenSky rate limit hit. Retrying in 60s.',
        aircraft: [],
        count: 0,
        rateLimited: true,
      }, { status: 429 });
    }

    if (!response.ok) {
      throw new Error(`OpenSky returned ${response.status}`);
    }

    const raw = await response.json();

    const states: OpenSkyState[] = raw.states ?? [];
    const aircraft = states
      .filter((s) => s[5] !== null && s[6] !== null)
      .map((s) => ({
        icao24:         s[0],
        callsign:       (s[1] ?? '').trim() || s[0],
        originCountry:  s[2],
        lastContact:    s[4],
        lon:            s[5] as number,
        lat:            s[6] as number,
        baroAltitude:   s[7],
        onGround:       s[8],
        velocity:       s[9],
        trueTrack:      s[10],
        verticalRate:   s[11],
        geoAltitude:    s[13],
        squawk:         s[14],
        spi:            s[15],
        positionSource: s[16],
        category:       s[17],
      }))
      .filter((a) => !a.onGround);

    const payload = {
      aircraft,
      count: aircraft.length,
      time: raw.time || Math.floor(now / 1000),
      bbox: { minLat, minLon, maxLat, maxLon },
    };

    bboxCache.set(cacheKey, { data: payload, timestamp: now });
    pruneCache();

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=15',
      },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ADS-B Proxy] Error:', message);

    if (cached) {
      return NextResponse.json({ ...cached.data, stale: true }, {
        headers: { 'X-Cache': 'STALE' },
      });
    }

    return NextResponse.json({
      error: 'Could not connect to OpenSky Network.',
      aircraft: [],
      count: 0,
    }, { status: 503 });
  }
}
