export const getMockTelemetry = (profile: 'dron' | 'helicopter' | 'paraglider' | 'parachute' | 'plane') => {
  const isParaglider = profile === 'paraglider';
  const isPlane = profile === 'plane';
  
  let status = 'GO';
  if (isParaglider) status = 'CAUTION';
  if (isPlane) status = 'GO';

  let message = "Ventana 100% segura. Cero interferencia electromagnética (Kp 2.1). Ráfagas nulas a baja altitud.";
  if (isParaglider) message = "Vientos sobre 15kts a 400ft. Riesgo de deriva alto para ultraligeros o velas sin propulsión.";
  if (isPlane) message = "Niveles de crucero despejados. Vuelo comercial e IFR sin restricciones. Cero turbulencia reportada.";

  return {
    timestamp: new Date().toISOString(),
    status: status,
    aiMessage: message,
    surfaceWind: {
      speedStr: "12",
      direction: "SW",
      angle: 210,
    },
    maxGusts: isParaglider ? "25" : "18",
    satellites: 18,
    kpIndex: 2.1,
    visibility: 10,
    temperature: 24,
    feelsLike: 26,
    rainChance: 0,
    clouds: 10,
    sun: {
      sunrise: "06:45",
      sunset: "18:30",
      progressPercent: 65,
    },
    verticalProfile: [
      { alt: '400ft', speed: 28, state: isParaglider ? 'critical' : 'warn' },
      { alt: '200ft', speed: 18, state: 'ok' },
      { alt: '100ft', speed: 14, state: 'ok' },
      { alt: 'SFC', speed: 8, state: 'calm' }
    ]
  };
};
