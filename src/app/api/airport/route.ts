// Proxy to aviationweather.gov airport endpoint — avoids browser CORS.
// GET /api/airport?icao=SKBO  →  { icaoId, name, lat, lon, ... }
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const icao = req.nextUrl.searchParams.get('icao')?.toUpperCase().trim();
  if (!icao || !/^[A-Z0-9]{3,4}$/.test(icao)) {
    return NextResponse.json({ error: 'Invalid ICAO code' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://aviationweather.gov/api/data/airport?ids=${icao}&format=json`,
      { next: { revalidate: 86400 } } // cache 24h — airport coords don't change
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }
    const data = await res.json() as Array<{ icaoId?: string; name?: string; lat?: number; lon?: number; elev?: number; country?: string }>;
    const airport = Array.isArray(data) ? data[0] : null;
    if (!airport?.lat || !airport?.lon) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({
      icao: airport.icaoId || icao,
      name: airport.name || icao,
      lat: airport.lat,
      lon: airport.lon,
      elevation: airport.elev,
      country: airport.country,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
