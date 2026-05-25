// Airspaces API — Live OpenAIP connection for global map rendering
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';
import type { AirspaceFeature } from '@/lib/types/api';

async function getLocalFallback(south: string, west: string, north: string, east: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'co_asp.geojson');
    const raw = await fs.readFile(filePath, 'utf-8');
    const geojson = JSON.parse(raw) as { features: AirspaceFeature[] };

    const s = parseFloat(south); const w = parseFloat(west);
    const n = parseFloat(north); const e = parseFloat(east);
    const PAD = 0.5;
    const features = geojson.features.filter((f) => {
      if (!f.geometry) return false;
      const ring: number[][] =
        f.geometry.type === 'Polygon'      ? (f.geometry.coordinates[0] as number[][]) ?? [] :
        f.geometry.type === 'MultiPolygon' ? ((f.geometry.coordinates[0] as number[][][])?.[0]) ?? [] : [];
      return ring.some(([lon, lat]) =>
        lat >= s - PAD && lat <= n + PAD &&
        lon >= w - PAD && lon <= e + PAD
      );
    });
    return { type: "FeatureCollection", features, total: features.length };
  } catch {
    return { type: "FeatureCollection", features: [], error: "Local fallback failed." };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const south = searchParams.get("south") ?? "-5";
  const west  = searchParams.get("west")  ?? "-80";
  const north = searchParams.get("north") ?? "15";
  const east  = searchParams.get("east")  ?? "-65";

  // El formato bbox en la API suele ser: minLon,minLat,maxLon,maxLat
  const bbox = `${west},${south},${east},${north}`;

  // Se necesita un API KEY de OpenAIP para consultas en vivo
  const apiKey = process.env.OPENAIP_API_KEY;

  if (!apiKey) {
    console.warn("OPENAIP_API_KEY is not defined. Falling back to local data if possible.");
    const fallback = await getLocalFallback(south, west, north, east);
    return NextResponse.json(fallback);
  }

  try {
    // Consultar a OpenAIP
    const response = await fetch(`https://api.core.openaip.net/api/airspaces?bbox=${bbox}`, {
      headers: {
        'x-openaip-client-id': apiKey,
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // cachear la respuesta 1 hora
    });

    if (!response.ok) {
      console.warn(`OpenAIP API error: ${response.statusText}. Falling back to local data.`);
      const fallback = await getLocalFallback(south, west, north, east);
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    
    // OpenAIP response contains items. We need to convert them to GeoJSON format for Leaflet
    interface OpenAipItem {
      name?: string;
      type?: number;
      icaoClass?: number;
      activity?: number;
      upperLimit?: unknown;
      lowerLimit?: unknown;
      geometry: AirspaceFeature['geometry'];
    }
    const features = ((data.items as OpenAipItem[]) || []).map((item) => ({
      type: "Feature",
      properties: {
        name: item.name,
        type: item.type,
        icaoClass: item.icaoClass,
        activity: item.activity,
        upperLimit: item.upperLimit,
        lowerLimit: item.lowerLimit
      },
      geometry: item.geometry
    }));

    return NextResponse.json({ type: "FeatureCollection", features, total: features.length });
  } catch (err) {
    console.error("Airspaces API error:", err);
    console.warn("Falling back to local data.");
    const fallback = await getLocalFallback(south, west, north, east);
    return NextResponse.json(fallback);
  }
}
