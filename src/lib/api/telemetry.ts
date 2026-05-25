import { PilotProfile, TelemetryData } from "@/store/useStore";

// Utils
function degToCompass(num: number) {
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
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
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m&daily=sunrise,sunset&timezone=auto`;
    const meteoReq = await fetch(meteoUrl);
    const meteoData = await meteoReq.json();

    // 2. Fetch NOAA Kp Index
    let kp = 1.0;
    try {
        const noaaReq = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
        const noaaData = await noaaReq.json();
        const latestKp = noaaData[noaaData.length - 1][1];
        if (latestKp) kp = parseFloat(latestKp);
    } catch {
        console.warn("NOAA API fallback");
        kp = 2.1;
    }

    const currentMeteo = meteoData.current;
    
    // Wind layers handling
    // We grab the hourly index closest to current hour (since hourly represents 24 hours of forecast, open-meteo sorts by time)
    // Simply picking index 0 (if fetched current) or we can just grab index 12 (mid-day). To be precise, let's use the first hour matching current time.
    const currentTimeStr = currentMeteo.time.substring(0, 14) + "00"; // roughly current hour block
    let hourIdx = meteoData.hourly.time.indexOf(currentTimeStr);
    if(hourIdx === -1) hourIdx = 0; // fallback

    const wind10m = meteoData.hourly.wind_speed_10m[hourIdx] || currentMeteo.wind_speed_10m;
    const wind80m = meteoData.hourly.wind_speed_80m[hourIdx] || wind10m * 1.5;
    const wind120m = meteoData.hourly.wind_speed_120m[hourIdx] || wind80m * 1.2;
    const wind180m = meteoData.hourly.wind_speed_180m[hourIdx] || wind120m * 1.1;

    // ─── GO / CAUTION / NO-GO Decision Engine (Drone) ─────────────────────────
    let status: 'GO' | 'CAUTION' | 'NO-GO' = 'GO';
    let message = "Ventana de vuelo inmejorable. Vientos nominales, GPS estable y espacio aéreo seguro.";

    if (currentMeteo.precipitation > 0) {
        status = 'NO-GO';
        message = "Precipitación detectada. Drones IP54+ requeridos. Riesgo de daño en motores y electrónica.";
    } else if (currentMeteo.wind_gusts_10m > DRONE_LIMITS.gustsKmh) {
        status = 'NO-GO';
        message = `Ráfagas extremas (${Math.round(currentMeteo.wind_gusts_10m)} km/h) en superficie. Abortar despegue — riesgo de fly-away.`;
    } else if (wind120m > DRONE_LIMITS.wind120mKmh) {
        status = 'CAUTION';
        message = `Vientos altos a 400 ft (${Math.round(wind120m)} km/h). Posible drift al ganar altitud — limitar a < 200 ft.`;
    } else if (kp > DRONE_LIMITS.kpStorm) {
        status = 'CAUTION';
        message = "Tormenta geomagnética (Kp alto). Riesgo de pérdida de enlace GPS o fly-away — usar Mode ATTI.";
    } else if (currentMeteo.wind_gusts_10m > DRONE_LIMITS.gustsCautionKmh) {
        status = 'CAUTION';
        message = `Ráfagas marginales (${Math.round(currentMeteo.wind_gusts_10m)} km/h). Pilotos novatos aterricen.`;
    } else if (currentMeteo.visibility < 3000) {
        status = 'CAUTION';
        message = "Visibilidad reducida. Mantener línea visual directa y no superar 120 m AGL.";
    }

    // Solar Window Calculation
    const sunriseStr = meteoData.daily.sunrise[0].split("T")[1];
    const sunsetStr = meteoData.daily.sunset[0].split("T")[1];
    
    // Calculate real solar progress percentage
    const now = new Date();
    const sunriseFull = new Date(meteoData.daily.sunrise[0]);
    const sunsetFull = new Date(meteoData.daily.sunset[0]);
    const totalDaylight = sunsetFull.getTime() - sunriseFull.getTime();
    const elapsed = now.getTime() - sunriseFull.getTime();
    const solarProgress = totalDaylight > 0
      ? Math.max(0, Math.min(100, Math.round((elapsed / totalDaylight) * 100)))
      : 0;
    
    // Simulating GPS Satellites via accuracy (Since JS Geolocation API only exposes accuracy in meters)
    // Max 30 sats, decreasing as accuracy gets worse.
    const sats = Math.max(0, Math.floor(30 - (accuracy / 5)));

    return {
      timestamp: new Date().toISOString(),
      gps: { lat, lon },
      status,
      aiMessage: message,
      surfaceWind: {
        speedStr: currentMeteo.wind_speed_10m.toFixed(1),
        direction: degToCompass(currentMeteo.wind_direction_10m),
        angle: currentMeteo.wind_direction_10m,
      },
      maxGusts: currentMeteo.wind_gusts_10m.toFixed(1),
      satellites: sats, // Estimated by accuracy
      kpIndex: kp,
      visibility: (currentMeteo.visibility / 1000).toFixed(1), // in KM
      temperature: currentMeteo.temperature_2m,
      feelsLike: currentMeteo.apparent_temperature,
      rainChance: currentMeteo.precipitation > 0 ? 100 : 0, // open-meteo current has precipitation value in mm
      clouds: currentMeteo.cloud_cover,
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
    };

  } catch (error) {
    console.error("API Telemetry Error", error);
    return null;
  }
}
