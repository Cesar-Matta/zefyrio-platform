// Proxy to aviationweather.gov airport endpoint — avoids browser CORS.
// GET /api/airport?icao=SKBO  →  { icaoId, name, lat, lon, ... }
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const icao = req.nextUrl.searchParams.get('icao')?.toUpperCase().trim();
  if (!icao || !/^[A-Z0-9]{3,4}$/.test(icao)) {
    return NextResponse.json({ error: 'Invalid ICAO code' }, { status: 400 });
  }

  let airport: { icaoId?: string; name?: string; lat?: number; lon?: number; elev?: number; country?: string } | null = null;

  try {
    const res = await fetch(
      `https://aviationweather.gov/api/data/airport?ids=${icao}&format=json`,
      { next: { revalidate: 86400 } } // cache 24h
    );
    if (res.ok) {
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (Array.isArray(data) && data.length > 0) {
        airport = data[0];
      }
    }
  } catch (err) {
    console.error("AWC Airport API failed:", err);
  }

  // Fallback to local GeoJSON database (Colombia) if not found in AWC
  if (!airport?.lat || !airport?.lon) {
    try {
      const geojsonPath = path.join(process.cwd(), 'public', 'data', 'co_airports.geojson');
      const fileData = fs.readFileSync(geojsonPath, 'utf8');
      const parsed = JSON.parse(fileData);
      const feature = parsed.features.find((f: any) => f.properties?.icaoCode?.toUpperCase() === icao);
      if (feature && feature.geometry?.coordinates) {
        airport = {
          icaoId: feature.properties.icaoCode,
          name: feature.properties.name,
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
          elev: feature.properties.elevation?.value,
          country: feature.properties.country
        };
      }
    } catch (err) {
      console.error("Local GeoJSON fallback failed:", err);
    }
  }

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
}
