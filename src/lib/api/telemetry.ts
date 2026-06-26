import { PilotProfile, TelemetryData } from "@/store/useStore";
import { fetchWithTimeout } from "./fetchWithTimeout";

// Utils
function degToCompass(num: number): string {
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    if (!Number.isFinite(num)) return arr[0];
    const val = Math.floor((num / 22.5) + 0.5);
    const idx = ((val % 16) + 16) % 16; // handle negatives safely
    return arr[idx] ?? arr[0];
}

// Drone safety thresholds — tuned for sub-25 kg multirotors.
const DRONE_LIMITS = {
  gustsKmh: 30,        // Surface gust ceiling — abort takeoff above this
  gustsCautionKmh: 22, // Marginal gusts
  wind120mKmh: 25,     // Wind at 400 ft (typical hover ceiling)
  kpStorm: 4.5,        // Geomagnetic Kp — fly-away risk above
};

export async function fetchLiveTelemetry(profile: PilotProfile, lat: number, lon: number, accuracy: number): Promise<TelemetryData | null> {
  // `profile` is reserved for future multi-profile expansion; locked to 'dron' today.
  void profile;
  try {
    // 1. Fetch Open-Meteo (SFC, Temp, Ráfagas, Lluvia, Vientos Altura)
    // Usamos hourly array para wind_speed a diferentes alturas: 10m(~sfc), 80m(~250ft), 120m(~400ft), 180m(~600ft)
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,dew_point_2m,precipitation,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_gusts_10m&daily=sunrise,sunset&timezone=auto`;
    const meteoReq = await fetchWithTimeout(meteoUrl, {}, 6000);
    if (!meteoReq.ok) throw new Error(`Open-Meteo HTTP ${meteoReq.status}`);
    const meteoData = await meteoReq.json();

    // Guard against malformed payloads — mobile carriers / captive portals
    // sometimes intercept HTTPS with HTML, returning JSON without our fields.
    if (!meteoData?.current || !meteoData?.hourly?.time || !meteoData?.daily?.sunrise) {
        throw new Error('Open-Meteo returned malformed payload');
    }

    // 2. Fetch NOAA Kp Index through our backend proxy to avoid CORS
    let kp = 1.0;
    try {
        const noaaReq = await fetchWithTimeout('/api/telemetry/kp', {}, 5000);
        if (noaaReq.ok) {
          const noaaData = await noaaReq.json();
          const latestKp = noaaData?.[noaaData.length - 1]?.Kp;
          if (latestKp !== undefined) kp = parseFloat(String(latestKp));
        }
    } catch {
        console.warn("NOAA API fallback");
        kp = 2.1;
    }

    const currentMeteo = meteoData.current;

    // Defensive numeric coercion — Open-Meteo can omit fields at edge lat/lon
    // (e.g. ocean tiles return null wind_speed_120m). Calling .toFixed on
    // undefined throws and white-screens the entire HUD on mobile.
    const num = (v: unknown, fallback = 0): number => {
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return Number.isFinite(n) ? n : fallback;
    };

    // Wind layers handling
    // We grab the hourly index closest to current hour (since hourly represents 24 hours of forecast, open-meteo sorts by time)
    // Simply picking index 0 (if fetched current) or we can just grab index 12 (mid-day). To be precise, let's use the first hour matching current time.
    const currentTimeStr = (currentMeteo.time ?? '').substring(0, 14) + "00"; // roughly current hour block
    let hourIdx = meteoData.hourly.time.indexOf(currentTimeStr);
    if(hourIdx === -1) hourIdx = 0; // fallback

    const wind10m = num(meteoData.hourly.wind_speed_10m?.[hourIdx]) || num(currentMeteo.wind_speed_10m);
    const wind80m = num(meteoData.hourly.wind_speed_80m?.[hourIdx]) || wind10m * 1.5;
    const wind120m = num(meteoData.hourly.wind_speed_120m?.[hourIdx]) || wind80m * 1.2;
    const wind180m = num(meteoData.hourly.wind_speed_180m?.[hourIdx]) || wind120m * 1.1;

    // Safe scalar reads for current weather — every downstream component
    // assumes finite numbers; any NaN/undefined makes WeatherCards/WindCompass crash.
    const sfcWindSpeed = num(currentMeteo.wind_speed_10m);
    const sfcWindDir = num(currentMeteo.wind_direction_10m);
    const sfcGusts = num(currentMeteo.wind_gusts_10m);
    const precip = num(currentMeteo.precipitation);
    const tempC = num(currentMeteo.temperature_2m);
    const feelsC = num(currentMeteo.apparent_temperature, tempC);
    const dewC = num(currentMeteo.dew_point_2m, tempC - 5);
    const cloudPct = num(currentMeteo.cloud_cover);
    const visM = num(currentMeteo.visibility, 10000);

    // Cloud base (Espy formula): ~125m per 1°C dew-point spread.
    // Converted to feet AGL. Capped at 10,000 ft (above drone ceiling anyway).
    const spreadC = Math.max(0, tempC - dewC);
    const cloudBaseFt = Math.min(10000, Math.round(spreadC * 125 * 3.281));

    // ─── GO / CAUTION / NO-GO Decision Engine (Drone) ─────────────────────────
    let status: 'GO' | 'CAUTION' | 'NO-GO' = 'GO';
    let message = "Ventana de vuelo inmejorable. Vientos nominales, GPS estable y espacio aéreo seguro.";

    if (precip > 0) {
        status = 'NO-GO';
        message = "Precipitación detectada. Drones IP54+ requeridos. Riesgo de daño en motores y electrónica.";
    } else if (sfcGusts > DRONE_LIMITS.gustsKmh) {
        status = 'NO-GO';
        message = `Ráfagas extremas (${Math.round(sfcGusts)} km/h) en superficie. Abortar despegue — riesgo de fly-away.`;
    } else if (wind120m > DRONE_LIMITS.wind120mKmh) {
        status = 'CAUTION';
        message = `Vientos altos a 400 ft (${Math.round(wind120m)} km/h). Posible drift al ganar altitud — limitar a < 200 ft.`;
    } else if (kp > DRONE_LIMITS.kpStorm) {
        status = 'CAUTION';
        message = "Tormenta geomagnética (Kp alto). Riesgo de pérdida de enlace GPS o fly-away — usar Mode ATTI.";
    } else if (sfcGusts > DRONE_LIMITS.gustsCautionKmh) {
        status = 'CAUTION';
        message = `Ráfagas marginales (${Math.round(sfcGusts)} km/h). Pilotos novatos aterricen.`;
    } else if (visM < 3000) {
        status = 'CAUTION';
        message = "Visibilidad reducida. Mantener línea visual directa y no superar 120 m AGL.";
    }

    // Solar Window Calculation — guard against missing daily payload.
    const sunriseRaw = String(meteoData.daily.sunrise?.[0] ?? '');
    const sunsetRaw = String(meteoData.daily.sunset?.[0] ?? '');
    const sunriseStr = sunriseRaw.includes('T') ? sunriseRaw.split('T')[1] : '06:00';
    const sunsetStr = sunsetRaw.includes('T') ? sunsetRaw.split('T')[1] : '18:00';

    // Calculate real solar progress percentage
    let solarProgress = 0;
    if (sunriseRaw && sunsetRaw) {
      const now = new Date();
      const sunriseFull = new Date(sunriseRaw);
      const sunsetFull = new Date(sunsetRaw);
      const totalDaylight = sunsetFull.getTime() - sunriseFull.getTime();
      const elapsed = now.getTime() - sunriseFull.getTime();
      solarProgress = totalDaylight > 0
        ? Math.max(0, Math.min(100, Math.round((elapsed / totalDaylight) * 100)))
        : 0;
    }

    // Simulating GPS Satellites via accuracy (Since JS Geolocation API only exposes accuracy in meters)
    // Max 30 sats, decreasing as accuracy gets worse.
    const sats = Math.max(0, Math.floor(30 - (accuracy / 5)));

    // Parse 7-day wind forecast
    const windForecast = (meteoData.hourly.time as string[]).map((tStr, i) => ({
      time: tStr,
      speed10m: num(meteoData.hourly.wind_speed_10m?.[i]),
      speed120m: num(meteoData.hourly.wind_speed_120m?.[i]),
      direction: num(meteoData.hourly.wind_direction_10m?.[i]),
      gusts: num(meteoData.hourly.wind_gusts_10m?.[i])
    }));

    // Reverse Geocoding
    let locationName = "Ubicación Desconocida";
    try {
      const geoReq = await fetchWithTimeout(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`, {}, 3000);
      if (geoReq.ok) {
        const geoData = await geoReq.json();
        locationName = geoData.locality || geoData.city || geoData.principalSubdivision || "Ubicación Actual";
      } else {
        throw new Error("BigDataCloud returned non-OK");
      }
    } catch (e) {
      console.warn("Geocoding fallback to Nominatim", e);
      try {
        const nomReq = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {}, 3000);
        if (nomReq.ok) {
          const nomData = await nomReq.json();
          const addr = nomData.address || {};
          locationName = addr.city || addr.town || addr.village || addr.municipality || addr.state || "Ubicación Actual";
        }
      } catch (e2) {
        console.warn("Nominatim fallback failed", e2);
      }
    }

    return {
      timestamp: new Date().toISOString(),
      gps: { lat, lon },
      status,
      aiMessage: message,
      surfaceWind: {
        speedStr: sfcWindSpeed.toFixed(1),
        direction: degToCompass(sfcWindDir),
        angle: sfcWindDir,
      },
      maxGusts: sfcGusts.toFixed(1),
      satellites: sats, // Estimated by accuracy
      kpIndex: kp,
      visibility: (visM / 1000).toFixed(1), // in KM
      temperature: tempC,
      feelsLike: feelsC,
      dewPoint: dewC,
      cloudBase: cloudBaseFt,
      rainChance: precip > 0 ? 100 : 0,
      clouds: cloudPct,
      sun: {
        sunrise: sunriseStr,
        sunset: sunsetStr,
        progressPercent: solarProgress,
      },
      verticalProfile: [
        { alt: '600ft+', speed: Math.round(wind180m), state: wind180m > 30 ? 'critical' : wind180m > 20 ? 'warn' : 'ok' },
        { alt: '400ft', speed: Math.round(wind120m), state: wind120m > 25 ? 'critical' : wind120m > 15 ? 'warn' : 'ok' },
        { alt: '200ft', speed: Math.round(wind80m), state: wind80m > 20 ? 'warn' : 'ok' },
        { alt: 'SFC', speed: Math.round(wind10m), state: wind10m > 15 ? 'warn' : 'calm' },
      ],
      windForecast,
      locationName,
    };

  } catch (error) {
    console.error("API Telemetry Error", error);
    return null;
  }
}
