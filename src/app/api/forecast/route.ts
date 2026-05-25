// /api/forecast — Hourly + daily forecast aggregator for the drone HUD.
// Source: Open-Meteo (free, no key). Returns the next 24h sliced from the
// current local hour so the client can render the user-facing windows.
import { NextRequest, NextResponse } from 'next/server';

export interface HourlyForecast {
  time: string;        // ISO local hour
  hour: string;        // "14:00"
  windSpeed: number;   // km/h at 10m
  windGusts: number;   // km/h
  windDir: number;     // degrees
  uvIndex: number;
  humidity: number;    // %
  visibility: number;  // metres
  cloudCover: number;  // %
  temperature: number; // °C
  precipitation: number; // mm
}

export interface ForecastResponse {
  hourly: HourlyForecast[];
  currentIndex: number;
  uvMax: number;
  fetchedAt: number;
  source: 'live' | 'error';
  timezone: string;
}

interface OpenMeteoHourly {
  time: string[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  wind_direction_10m: number[];
  uv_index: number[];
  relative_humidity_2m: number[];
  visibility: number[];
  cloud_cover: number[];
  temperature_2m: number[];
  precipitation: number[];
}

interface OpenMeteoDaily {
  uv_index_max: number[];
}

interface OpenMeteoResponse {
  current?: { time: string };
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
  timezone: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '4.6');
  const lon = parseFloat(searchParams.get('lon') ?? '-74.08');

  const hourlyParams = [
    'temperature_2m',
    'precipitation',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
    'uv_index',
    'relative_humidity_2m',
    'visibility',
    'cloud_cover',
  ].join(',');

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('hourly', hourlyParams);
  url.searchParams.set('daily', 'uv_index_max');
  url.searchParams.set('current', 'time');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '2');

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 900 }, // 15 min cache
    });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

    const data = (await res.json()) as OpenMeteoResponse;
    const hourly = data.hourly;

    // Anchor on the local current hour returned by Open-Meteo.
    const currentTimeStr = data.current?.time
      ? data.current.time.slice(0, 13) + ':00'
      : hourly.time[0];

    let anchor = hourly.time.indexOf(currentTimeStr);
    if (anchor < 0) anchor = 0;

    // Take the next 24 hourly samples from the anchor.
    const end = Math.min(anchor + 24, hourly.time.length);
    const slice: HourlyForecast[] = [];
    for (let i = anchor; i < end; i++) {
      slice.push({
        time:          hourly.time[i],
        hour:          hourly.time[i].slice(11, 16),
        windSpeed:     hourly.wind_speed_10m[i],
        windGusts:     hourly.wind_gusts_10m[i],
        windDir:       hourly.wind_direction_10m[i],
        uvIndex:       hourly.uv_index[i] ?? 0,
        humidity:      hourly.relative_humidity_2m[i] ?? 0,
        visibility:    hourly.visibility[i] ?? 0,
        cloudCover:    hourly.cloud_cover[i] ?? 0,
        temperature:   hourly.temperature_2m[i] ?? 0,
        precipitation: hourly.precipitation[i] ?? 0,
      });
    }

    const payload: ForecastResponse = {
      hourly: slice,
      currentIndex: 0,
      uvMax: data.daily?.uv_index_max?.[0] ?? 0,
      fetchedAt: Date.now(),
      source: 'live',
      timezone: data.timezone,
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        hourly: [],
        currentIndex: 0,
        uvMax: 0,
        fetchedAt: Date.now(),
        source: 'error',
        timezone: 'UTC',
        error: message,
      } satisfies ForecastResponse & { error: string },
      { status: 200 },
    );
  }
}
