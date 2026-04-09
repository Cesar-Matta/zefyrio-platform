// SKILL: api-patterns — Proxy seguro para ADS-B / tráfico aéreo en tiempo real
// Fuente: OpenSky Network REST API (sin auth para datos públicos de aeronaves)
// Docs: https://openskynetwork.github.io/opensky-api/rest.html
import { NextRequest, NextResponse } from 'next/server';

// Cache en memoria del servidor para reducir peticiones repetitivas
let serverCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 15_000; // 15 segundos — tráfico aéreo se actualiza cada 10-15s en OpenSky

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // BBOX: minLat,minLon,maxLat,maxLon (ej: "32.5,-120.1,35.2,-116.8")
  const bbox = searchParams.get('bbox');
  
  if (!bbox) {
    return NextResponse.json({ error: 'Parámetro bbox requerido. Formato: minLat,minLon,maxLat,maxLon' }, { status: 400 });
  }

  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json({ error: 'BBOX inválido' }, { status: 400 });
  }

  const [minLat, minLon, maxLat, maxLon] = parts;

  // Devolver caché si sigue fresca
  const now = Date.now();
  if (serverCache && now - serverCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(serverCache.data, {
      headers: {
        'X-Cache': 'HIT',
        'X-Cache-Age': `${Math.floor((now - serverCache.timestamp) / 1000)}s`,
      },
    });
  }

  try {
    // OpenSky Network — endpoint de estados de aeronaves dentro de un BBOX
    // laMin, loMin = esquina SW | laMax, loMax = esquina NE
    const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // Sin credenciales para acceso anónimo (limitado a ~400 aeronaves en el BBOX)
        // Para acceso ampliado, agregar: Authorization: Basic base64(user:pass)
      },
      // Timeout en servidor (10s máx para no bloquear el cliente)
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // OpenSky puede devolver 429 si se excede el rate limit (anónimo: 10 req/min)
      if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit OpenSky alcanzado. Intenta en 60s.',
          aircraft: [],
          time: now / 1000
        }, { status: 429 });
      }
      throw new Error(`OpenSky respondió ${response.status}`);
    }

    const raw = await response.json();
    
    // OpenSky devuelve: { time: number, states: [[icao24, callsign, origin_country, ...], ...] }
    // Convertimos a objetos tipados para el frontend
    const aircraft = (raw.states || [])
      .filter((s: any[]) => s[5] !== null && s[6] !== null) // Filtrar sin posición
      .map((s: any[]) => ({
        icao24: s[0] as string,           // Identificador ICAO 24-bit (hex)
        callsign: (s[1] as string || '').trim() || s[0], // Vuelo o matrícula
        originCountry: s[2] as string,    // País de matrícula
        lastContact: s[4] as number,      // Timestamp último contacto
        lon: s[5] as number,              // Longitud actual
        lat: s[6] as number,              // Latitud actual
        baroAltitude: s[7] as number,     // Altitud barómetrica (metros)
        onGround: s[8] as boolean,        // ¿Está en tierra?
        velocity: s[9] as number,         // Velocidad horizonal (m/s)
        trueTrack: s[10] as number,       // Rumbo verdadero (grados, 0=Norte)
        verticalRate: s[11] as number,    // Tasa ascenso/descenso (m/s)
        geoAltitude: s[13] as number,     // Altitud GPS (metros)
        squawk: s[14] as string,          // Código transponder
        spi: s[15] as boolean,            // Special Purpose Indicator
        positionSource: s[16] as number,  // 0=ADS-B, 1=ASTERIX, 2=MLAT
        category: s[17] as number,        // Categoría ICAO (0=No info, 1=Light, 5=Heavy, 7=Rotorcraft)
      }))
      .filter((a: any) => !a.onGround); // Opcional: filtrar aeronaves en tierra

    const payload = {
      aircraft,
      count: aircraft.length,
      time: raw.time || Math.floor(now / 1000),
      bbox: { minLat, minLon, maxLat, maxLon },
    };

    // Guardar en caché del servidor
    serverCache = { data: payload, timestamp: now };

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=15',
      },
    });

  } catch (err: any) {
    console.error('[ADS-B Proxy] Error:', err.message);
    
    // Si falla, devolver caché expirada si existe (mejor que nada)
    if (serverCache) {
      return NextResponse.json({ ...serverCache.data, stale: true }, {
        headers: { 'X-Cache': 'STALE' },
      });
    }

    return NextResponse.json({ 
      error: 'No se pudo conectar con OpenSky Network',
      aircraft: [],
      count: 0
    }, { status: 503 });
  }
}
