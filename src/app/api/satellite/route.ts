// GOES-East (GOES-19) GeoColor satellite layer.
// Source: RealEarth (SSEC / Univ. Wisconsin–Madison) — keyless Web-Mercator
// XYZ tiles, Full Disk, so it covers BOTH hemispheres (fixes the old
// IEM "north-only" gap). We only proxy the *latest timestamp* here; the
// browser fetches the tiles straight from RealEarth's CDN (CORS: *).
import { NextResponse } from "next/server";

const PRODUCT = "G19-ABI-FD-geo-color";
const TILE_HOST = "https://realearth.ssec.wisc.edu/api/image";
const ATTRIBUTION = "GOES-19 GeoColor · NOAA/NESDIS · SSEC RealEarth";

// "20260616.142022" -> ISO "2026-06-16T14:20:22Z"
function toIso(stamp: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})\.(\d{2})(\d{2})(\d{2})$/.exec(stamp);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

export async function GET() {
  try {
    const res = await fetch(
      `https://realearth.ssec.wisc.edu/api/times?products=${PRODUCT}`,
      { next: { revalidate: 300 } } // refresh latest frame at most every 5 min
    );

    let time: string | null = null;
    if (res.ok) {
      const data = (await res.json()) as Record<string, string[]>;
      const frames = data[PRODUCT];
      if (Array.isArray(frames) && frames.length) time = frames[frames.length - 1];
    }

    // Leaflet TileLayer template. When `time` is known we pin the exact frame
    // (cache-friendly + lets us show the capture time); otherwise RealEarth
    // serves whatever is latest.
    const products = time ? `${PRODUCT}.${time}` : PRODUCT;
    const urlTemplate = `${TILE_HOST}?products=${products}&x={x}&y={y}&z={z}`;

    return NextResponse.json({
      product: PRODUCT,
      time,
      iso: time ? toIso(time) : null,
      urlTemplate,
      attribution: ATTRIBUTION,
    });
  } catch (err) {
    console.error("Satellite (GOES) API error:", err);
    // Fallback: still usable, just unpinned/latest.
    return NextResponse.json({
      product: PRODUCT,
      time: null,
      iso: null,
      urlTemplate: `${TILE_HOST}?products=${PRODUCT}&x={x}&y={y}&z={z}`,
      attribution: ATTRIBUTION,
    });
  }
}
