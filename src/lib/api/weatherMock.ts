import type { TelemetryData, FlightStatus } from '@/store/useStore';

export const getMockTelemetry = (_profile: 'dron'): TelemetryData => {
  const status: FlightStatus = 'GO';
  const message = "Modo Demo — Datos de ejemplo. Sin señal GPS. Abre el navegador con HTTPS o acepta la geolocalización para ver datos reales.";

  return {
    timestamp: new Date().toISOString(),
    status,
    aiMessage: message,
    gps: undefined,
    surfaceWind: {
      speedStr: "12",
      direction: "SW",
      angle: 210,
    },
    maxGusts: "18",
    satellites: 18,
    kpIndex: 2.1,
    kpForecast: [
      { time: new Date(Date.now() - 3600000).toISOString(), kp: 2.3 },
      { time: new Date(Date.now() + 3600000 * 2).toISOString(), kp: 3.0 },
      { time: new Date(Date.now() + 3600000 * 5).toISOString(), kp: 4.1 },
      { time: new Date(Date.now() + 3600000 * 8).toISOString(), kp: 1.5 },
      { time: new Date(Date.now() + 3600000 * 11).toISOString(), kp: 2.0 },
    ],
    visibility: "10.0",      // string — matches TelemetryData.visibility
    temperature: 24,
    feelsLike: 26,
    dewPoint: 18,
    cloudBase: 2460,
    rainChance: 0,
    clouds: 10,
    sun: {
      sunrise: "06:45",
      sunset: "18:30",
      progressPercent: 65,
    },
    verticalProfile: [
      { alt: '600ft+', speed: 18, state: 'ok' },
      { alt: '400ft',  speed: 14, state: 'ok' },
      { alt: '200ft',  speed: 10, state: 'calm' },
      { alt: 'SFC',    speed: 8,  state: 'calm' },
    ],
  };
};
