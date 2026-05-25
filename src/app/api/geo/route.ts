// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — Geolocation Resolver (Edge-friendly, zero-latency)
// Source: Vercel's built-in IP geolocation request headers
//   x-vercel-ip-country, x-vercel-ip-country-region,
//   x-vercel-ip-city, x-vercel-ip-latitude, x-vercel-ip-longitude
//
// Why this exists:
//   • ipapi.co — free tier 1000/day, frequently blocked by ad-blockers
//     and geo-restricted in some countries.
//   • ip-api.com — HTTPS endpoint requires paid plan; HTTP version
//     is blocked as mixed content from an HTTPS page.
//   • ipwho.is — inconsistent CORS, sporadic availability.
//
// Vercel headers are populated at the edge for every request, so this
// route is sub-1ms, has no rate limit, no CORS issues, and works
// globally everywhere Vercel serves traffic from.
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const h = req.headers;

  const latStr = h.get('x-vercel-ip-latitude');
  const lonStr = h.get('x-vercel-ip-longitude');
  const country = h.get('x-vercel-ip-country') ?? null;
  const region = h.get('x-vercel-ip-country-region') ?? null;
  const city = h.get('x-vercel-ip-city') ? decodeURIComponent(h.get('x-vercel-ip-city') as string) : null;

  const lat = latStr ? parseFloat(latStr) : NaN;
  const lon = lonStr ? parseFloat(lonStr) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    // Local dev or non-Vercel runtime — caller will fall back to external IP service.
    return NextResponse.json(
      { ok: false, error: 'no-geo-headers', country, region, city },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { ok: true, lat, lon, country, region, city, source: 'vercel-edge' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
