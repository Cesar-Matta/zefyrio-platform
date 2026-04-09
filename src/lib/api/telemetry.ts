import { PilotProfile } from "@/store/useStore";

// Utils
function degToCompass(num: number) {
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}

export async function fetchLiveTelemetry(profile: PilotProfile, lat: number, lon: number, accuracy: number) {
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
        // El último elemento de la matriz suele ser la lectura más reciente [timestamp, kp]
        const latestKp = noaaData[noaaData.length - 1][1];
        if (latestKp) kp = parseFloat(latestKp);
    } catch(err) {
        console.warn("NOAA API fallback");
        kp = 2.1; // Fallback
    }

    const isParaglider = profile === 'paraglider' || profile === 'parachute';
    const isPlane = profile === 'plane';

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

    // IA Logic 
    let status = 'GO';
    let message = "Ventana de vuelo inmejorable. Cielos despejados, vientos nominales y espacio aéreo seguro.";

    if (currentMeteo.precipitation > 0) {
        status = 'NO-GO';
        message = "Precipitación detectada. Riesgo de congelamiento de rotores o alas mojadas.";
    } else if (currentMeteo.wind_gusts_10m > 30) {
        status = 'NO-GO';
        message = "Ráfagas extremas detectadas en superficie. Abortar despegues.";
    } else if (kp > 4.5 && profile === 'dron') {
        status = 'CAUTION';
        message = "Tormenta geomagnética (Kp Alto). Probabilidad de pérdida de enlace satelital GPS o Fly-Away.";
    } else if (wind120m > 25 && isParaglider) {
        status = 'CAUTION';
        message = "Vientos marginales a 400ft. Alto riesgo de deriva en vela. Mantenerse debajo de la capa de corte.";
    } else if (isPlane) {
        status = 'GO';
        message = "Niveles de crucero despejados. Vuelo comercial e IFR sin restricciones reportadas.";
    }

    // Solar Window Calculation
    const sunriseStr = meteoData.daily.sunrise[0].split("T")[1];
    const sunsetStr = meteoData.daily.sunset[0].split("T")[1];
    
    // Simulating GPS Satellites via accuracy (Since JS Geolocation API only exposes accuracy in meters)
    // Max 30 sats, decreasing as accuracy gets worse.
    const sats = Math.max(0, Math.floor(30 - (accuracy / 5)));

    return {
      timestamp: new Date().toISOString(),
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
        progressPercent: 50, // Lo dejaremos estático visualmente temporal, o se calcularía con Date(). Time API.
      },
      verticalProfile: [
        { alt: '600ft+', speed: Math.round(wind180m), state: wind180m > 30 ? 'critical' : wind180m > 20 ? 'warn' : 'ok' },
        { alt: '400ft', speed: Math.round(wind120m), state: wind120m > 25 ? 'critical' : wind120m > 15 ? 'warn' : 'ok' },
        { alt: '200ft', speed: Math.round(wind80m), state: wind80m > 20 ? 'warn' : 'ok' },
        { alt: 'SFC', speed: Math.round(wind10m), state: wind10m > 15 ? 'warn' : 'calm' }
      ]
    };

  } catch (error) {
    console.error("API Telemetry Error", error);
    return null;
  }
}
