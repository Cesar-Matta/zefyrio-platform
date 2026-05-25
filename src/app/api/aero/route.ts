import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const bboxParam = searchParams.get('bbox');

  if (!bboxParam && (!lat || !lon)) {
    return NextResponse.json({ error: 'Faltan coordenadas o el BoundingBox de visualización' }, { status: 400 });
  }

  let finalBbox = bboxParam;

  if (!finalBbox) {
    // AWC (Aviation Weather Center) actualizó sus endpoints. En vez de "radialdistance", pide un "Bounding Box" (BBOX).
    // Generaremos un BBox de barrido espacial GIGANTE de ~220km (Radio de 2.0 grados) alrededor del Piloto.
    const latNum = parseFloat(lat!);
    const lonNum = parseFloat(lon!);
    
    const minLon = (lonNum - 0.5).toFixed(2);
    const minLat = (latNum - 0.5).toFixed(2);
    const maxLon = (lonNum + 0.5).toFixed(2);
    const maxLat = (latNum + 0.5).toFixed(2);
    
    // ¡CUIDADO! AviationWeather.gov usa [minLat, minLon, maxLat, maxLon] a diferencia del estándar GIS (Lon,Lat).
    // Reducido a 0.5 de nuevo para captar aeropuertos locales precisos sin saturar.
    finalBbox = `${minLat},${minLon},${maxLat},${maxLon}`;
  }

  try {
    const metarUrl = `https://aviationweather.gov/api/data/metar?bbox=${finalBbox}&format=json&hours=1`;
    const metarReq = await fetch(metarUrl);
    const metarText = await metarReq.text();
    const metarData = metarText ? JSON.parse(metarText) : [];

    const tafUrl = `https://aviationweather.gov/api/data/taf?bbox=${finalBbox}&format=json`;
    const tafReq = await fetch(tafUrl);
    const tafText = await tafReq.text();
    const tafData = tafText ? JSON.parse(tafText) : [];

    const notamsPlaceholder = [
       { id: "A1234/26", type: "NOTAM", content: "RWY 09L/27R CLSD. ZONA DE RESTRICCIÓN TEMPORAL Drones (TFR) ACTIVADA HASTA NUEVO AVISO." }
    ];

    return NextResponse.json({
        metar: metarData,
        taf: tafData,
        notams: notamsPlaceholder
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
