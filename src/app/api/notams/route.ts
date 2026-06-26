// NOTAMs API Route
//   1) Real operational NOTAMs from the FAA NOTAM API (when credentials are
//      configured) — covers Colombian ICAO stations (SK..).
//   2) Fallback: nearby restricted/danger/prohibited airspaces from OpenAIP,
//      so the widget still shows real restrictions before the FAA key is set.
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';
import type { AirspaceFeature, GeoPolygon, NotamItem } from '@/lib/types/api';

// Haversine distance in nautical miles
function getDistanceNm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3440.065;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function extractFirstRing(geom: GeoPolygon | null | undefined): number[][] {
  if (!geom) return [];
  if (geom.type === 'Polygon') return (geom.coordinates[0] as number[][]) ?? [];
  if (geom.type === 'MultiPolygon') return ((geom.coordinates[0] as number[][][])?.[0]) ?? [];
  return [];
}

function getCentroid(geom: GeoPolygon | null | undefined): [number, number] | null {
  try {
    const coords = extractFirstRing(geom);
    if (coords.length === 0) return null;
    let sumLon = 0, sumLat = 0;
    for (const [lon, lat] of coords) { sumLon += lon; sumLat += lat; }
    return [sumLat / coords.length, sumLon / coords.length];
  } catch {
    return null;
  }
}

const isClose = (geom: GeoPolygon | null | undefined, centerLat: number, centerLon: number, radiusNm: number) => {
  if (!geom) return false;
  const centroid = getCentroid(geom);
  if (centroid && getDistanceNm(centerLat, centerLon, centroid[0], centroid[1]) <= radiusNm * 3) return true;
  for (const [lon, lat] of extractFirstRing(geom)) {
    if (getDistanceNm(centerLat, centerLon, lat, lon) <= radiusNm) return true;
  }
  return false;
}

// ─── FAA NOTAM API ───────────────────────────────────────────────────────────
// Docs: https://api.faa.gov/s/ → "NOTAM API". Register (free) for client_id /
// client_secret and set FAA_NOTAM_CLIENT_ID / FAA_NOTAM_CLIENT_SECRET.
interface FaaNotamRecord {
  number?: string;
  id?: string;
  type?: string;
  classification?: string;
  location?: string;
  icaoLocation?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  text?: string;
}
interface FaaItem {
  properties?: {
    coreNOTAMData?: {
      notam?: FaaNotamRecord;
      notamTranslation?: Array<{ type?: string; formattedText?: string; simpleText?: string }>;
    };
  };
}

function mapFaaItem(item: FaaItem): NotamItem | null {
  const core = item?.properties?.coreNOTAMData;
  const notam = core?.notam;
  if (!notam) return null;

  const translations = core?.notamTranslation ?? [];
  const body =
    notam.text ||
    translations.find(t => t?.formattedText)?.formattedText ||
    translations.find(t => t?.simpleText)?.simpleText ||
    'NOTAM sin texto disponible.';

  // "PERM" (permanent) is not a date — leave end blank so the UI shows nothing.
  const end = notam.effectiveEnd && notam.effectiveEnd !== 'PERM' ? notam.effectiveEnd : '';

  return {
    properties: {
      notamNumber: notam.number || notam.id || 'NOTAM',
      typeLabel: 'NOTAM',
      distanceNm: null, // FAA already filtered by radius
      notamEvent: {
        id: notam.id || notam.number || '',
        type: notam.type || 'N',
        classification: notam.classification || 'INTL',
        location: notam.icaoLocation || notam.location || '',
        effectiveStart: notam.effectiveStart || '',
        effectiveEnd: end,
        text: body,
        icaoLocation: notam.icaoLocation,
      },
      startDate: notam.effectiveStart,
    },
  };
}

// Returns mapped NOTAMs on success, or null when unavailable (so the caller
// can fall back to the airspace data).
async function fetchFaaNotams(lat: number, lon: number, radiusNm: number): Promise<NotamItem[] | null> {
  const clientId = process.env.FAA_NOTAM_CLIENT_ID;
  const clientSecret = process.env.FAA_NOTAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const r = Math.min(Math.max(Math.round(radiusNm), 1), 100); // API caps at 100 nm
    const url =
      `https://external-api.faa.gov/notamapi/v1/notams` +
      `?locationLongitude=${lon}&locationLatitude=${lat}&locationRadius=${r}` +
      `&pageSize=50&pageNum=1&sortBy=effectiveStartDate&sortOrder=Desc`;

    const res = await fetch(url, {
      headers: { client_id: clientId, client_secret: clientSecret, Accept: 'application/json' },
      next: { revalidate: 600 }, // refresh ≤10 min
    });
    if (!res.ok) {
      console.warn(`[NOTAMs] FAA API error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json() as { items?: FaaItem[] };
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(mapFaaItem).filter((x): x is NotamItem => x !== null);
  } catch (err) {
    console.error('[NOTAMs] FAA fetch failed:', err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "4.6");
  const lon = parseFloat(searchParams.get("lon") ?? "-74.0");
  const radius = parseFloat(searchParams.get("radius") ?? "50"); // nm

  // ── 1) Real NOTAMs (FAA) ──────────────────────────────────────────────────
  const faaItems = await fetchFaaNotams(lat, lon, radius);
  if (faaItems) {
    return NextResponse.json(
      { items: faaItems, source: 'faa', fetchedAt: Date.now() },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' } }
    );
  }

  // ── 2) Fallback: nearby restricted airspaces (OpenAIP / local) ────────────
  const degOffset = (radius / 60) * 1.5;
  const bbox = `${lon - degOffset},${lat - degOffset},${lon + degOffset},${lat + degOffset}`;
  let features: AirspaceFeature[] = [];
  const apiKey = process.env.OPENAIP_API_KEY;

  async function loadLocalFeatures(): Promise<AirspaceFeature[]> {
    try {
      const filePath = path.join(process.cwd(), 'public', 'data', 'co_asp.geojson');
      const raw = await fs.readFile(filePath, 'utf-8');
      const geojson = JSON.parse(raw) as { features: AirspaceFeature[] };
      return geojson.features;
    } catch {
      return [];
    }
  }

  try {
    let usedLive = false;
    if (apiKey) {
      const response = await fetch(`https://api.core.openaip.net/api/airspaces?bbox=${bbox}`, {
        headers: { 'x-openaip-client-id': apiKey, 'Accept': 'application/json' },
        next: { revalidate: 3600 }
      });
      if (!response.ok) {
        console.warn(`[NOTAMs] OpenAIP API error: ${response.statusText}. Falling back to local data.`);
        features = await loadLocalFeatures();
      } else {
        const data = await response.json();
        interface OpenAipAirspace { geometry: GeoPolygon | null; [k: string]: unknown }
        features = ((data.items as OpenAipAirspace[]) || []).map((item) => ({
          type: "Feature" as const,
          properties: item as AirspaceFeature['properties'],
          geometry: item.geometry,
        }));
        usedLive = true;
      }
    } else {
      features = await loadLocalFeatures();
    }

    const nearbyRestricted = features.filter((f) => {
      const type = f.properties?.type;
      if (type === undefined || ![0, 1, 2, 3, 4, 21].includes(type)) return false;
      return isClose(f.geometry, lat, lon, radius);
    });

    const TYPE_LABELS: Record<number, string> = {
      0: "RESTRICTED AREA",
      1: "DANGER AREA",
      2: "PROHIBITED AREA",
      3: "CTR — CONTROL ZONE",
      4: "TMA — TERMINAL MANEUVERING AREA",
      21: "SPECIAL USE AIRSPACE",
    };

    const items = nearbyRestricted.map((f) => {
      const airspaceType = f.properties?.type ?? -1;
      const typeLabel = TYPE_LABELS[airspaceType] ?? "RESTRICTED AIRSPACE";
      const centroid = getCentroid(f.geometry);
      const distanceNm = centroid
        ? Math.round(getDistanceNm(lat, lon, centroid[0], centroid[1]) * 10) / 10
        : null;
      return {
        properties: {
          notamNumber: f.properties.name || "UNNAMED AIRSPACE",
          airspaceType,
          typeLabel,
          distanceNm,
          notamEvent: {
            id: f.properties._id || String(f.id ?? ''),
            type: "TFR",
            classification: "DOM",
            location: f.properties.country || "GLOBAL",
            effectiveStart: f.properties.createdAt || new Date().toISOString(),
            effectiveEnd: new Date(Date.now() + 86400000 * 365).toISOString(),
            text: `${typeLabel}: ${f.properties.name || 'Airspace'} is active. Operations require authorization.`,
          },
          geometry: f.geometry,
        },
      };
    });

    items.sort((a, b) => (a.properties.distanceNm ?? 9999) - (b.properties.distanceNm ?? 9999));

    return NextResponse.json({ items, source: usedLive ? 'airspace-live' : 'airspace-cache', fetchedAt: Date.now() });
  } catch (err) {
    console.error("[NOTAMs API]", err);
    return NextResponse.json(
      { items: [], source: 'error-fallback', fetchedAt: Date.now(), error: String(err) },
      { status: 200 }
    );
  }
}
