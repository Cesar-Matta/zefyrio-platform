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
    
    const typeMap: Record<number, string> = { 1: 'R', 2: 'D', 3: 'P', 4: 'CTR', 5: 'TMA' };
    const classMap: Record<number, string> = { 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G' };
    const actMap: Record<number, string> = { 1: 'PAR', 2: 'GLD', 3: 'HG', 4: 'MIL' };

    const features = geojson.features.filter((f) => {
      if (!f.geometry) return false;
      const ring: number[][] =
        f.geometry.type === 'Polygon'      ? (f.geometry.coordinates[0] as number[][]) ?? [] :
        f.geometry.type === 'MultiPolygon' ? ((f.geometry.coordinates[0] as number[][][])?.[0]) ?? [] : [];
      return ring.some(([lon, lat]) =>
        lat >= s - PAD && lat <= n + PAD &&
        lon >= w - PAD && lon <= e + PAD
      );
    }).map(f => {
      // Map OpenAIP integer codes to our frontend string codes
      const p = f.properties;
      return {
        ...f,
        properties: {
          ...p,
          type: typeof p.type === 'number' ? typeMap[p.type] || p.type : p.type,
          icaoClass: typeof p.icaoClass === 'number' ? classMap[p.icaoClass] || p.icaoClass : p.icaoClass,
          activity: typeof p.activity === 'number' ? actMap[p.activity] || p.activity : p.activity
        }
      };
    });
    return { type: "FeatureCollection", features, total: features.length };
  } catch (err) {
    console.error(err);
    return { type: "FeatureCollection", features: [], error: "Local fallback failed." };
  }
}

async function getFAAAirspaces(south: string, west: string, north: string, east: string) {
  try {
    const geom = encodeURIComponent(JSON.stringify({
      xmin: parseFloat(west),
      ymin: parseFloat(south),
      xmax: parseFloat(east),
      ymax: parseFloat(north),
      spatialReference: { wkid: 4326 }
    }));
    
    const baseUrl = 'https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/arcgis/rest/services';
    const params = `f=geojson&geometryType=esriGeometryEnvelope&geometry=${geom}&inSR=4326&outSR=4326&outFields=*`;
    
    const [classRes, suaRes] = await Promise.all([
      fetch(`${baseUrl}/Class_Airspace/FeatureServer/0/query?${params}`).catch(() => null),
      fetch(`${baseUrl}/Special_Use_Airspace/FeatureServer/0/query?${params}`).catch(() => null)
    ]);
    
    let features: AirspaceFeature[] = [];
    
    if (classRes && classRes.ok) {
      const classData = await classRes.json();
      if (classData.features) {
        const mapped = classData.features.map((f: any) => {
          let t = '';
          let c = '';
          if (f.properties.CLASS === 'B' || f.properties.CLASS === 'C') t = 'TMA';
          else if (f.properties.CLASS === 'D') t = 'CTR';
          else if (f.properties.CLASS === 'E') c = 'E';
          
          return {
            type: 'Feature',
            properties: {
              name: f.properties.NAME || f.properties.IDENT,
              type: t,
              icaoClass: c,
              lowerLimit: { value: f.properties.LOWER_VAL || 0 },
              upperLimit: { value: f.properties.UPPER_VAL || 0 }
            },
            geometry: f.geometry
          };
        });
        features = [...features, ...mapped];
      }
    }
    
    if (suaRes && suaRes.ok) {
      const suaData = await suaRes.json();
      if (suaData.features) {
        const mapped = suaData.features.map((f: any) => {
          let t = '';
          const tc = f.properties.TYPE_CODE;
          if (tc === 'R') t = 'R';
          else if (tc === 'P') t = 'P';
          else if (tc === 'D' || tc === 'W' || tc === 'A') t = 'D';
          else if (tc === 'MOA') t = 'SUA';
          
          return {
            type: 'Feature',
            properties: {
              name: f.properties.NAME,
              type: t,
              lowerLimit: { value: f.properties.LOWER_VAL || 0 },
              upperLimit: { value: f.properties.UPPER_VAL || 0 }
            },
            geometry: f.geometry
          };
        });
        features = [...features, ...mapped];
      }
    }
    
    return features.length > 0 ? { type: "FeatureCollection", features, total: features.length } : null;
  } catch (err) {
    console.error("FAA API fallback failed:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const south = searchParams.get("south") ?? "-5";
  const west  = searchParams.get("west")  ?? "-80";
  const north = searchParams.get("north") ?? "15";
  const east  = searchParams.get("east")  ?? "-65";

  const bbox = `${west},${south},${east},${north}`;
  const apiKey = process.env.OPENAIP_API_KEY;

  const tryFallback = async () => {
    const faa = await getFAAAirspaces(south, west, north, east);
    if (faa) return NextResponse.json(faa);
    return NextResponse.json(await getLocalFallback(south, west, north, east));
  };

  if (!apiKey) {
    console.warn("OPENAIP_API_KEY is not defined. Using FAA/Local fallback.");
    return await tryFallback();
  }

  try {
    const response = await fetch(`https://api.core.openaip.net/api/airspaces?bbox=${bbox}`, {
      headers: {
        'x-openaip-client-id': apiKey,
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.warn(`OpenAIP API error: ${response.statusText}. Using FAA/Local fallback.`);
      return await tryFallback();
    }

    const data = await response.json();
    const features = ((data.items as any[]) || []).map((item) => ({
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
    return await tryFallback();
  }
}
