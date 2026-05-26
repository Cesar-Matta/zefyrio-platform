// factors.ts — Compute a structured breakdown of every safety factor that
// goes into the GO/CAUTION/NO-GO decision. Mirrors UAV Forecast's table.

import type { TelemetryData } from '@/store/useStore';

export type FactorTier = 'good' | 'warn' | 'bad' | 'info';

export interface Factor {
  label: string;        // "Ráfagas"
  value: string;        // "18 km/h"
  threshold: string;    // "≤ 30" or "—" for informational
  tier: FactorTier;     // good = green, warn = amber, bad = red, info = neutral
}

// Drone-tuned thresholds — keep in sync with src/lib/api/telemetry.ts DRONE_LIMITS
const T = {
  gustsBad:  30,
  gustsWarn: 22,
  wind400Bad:  25,
  wind400Warn: 15,
  visKmGood: 3,
  cloudBaseFtGood: 400,
  satellitesGood: 9,
  kpBad: 4.5,
  kpWarn: 3,
};

export function computeFactors(data: TelemetryData): Factor[] {
  const sfcWind = parseFloat(data.surfaceWind?.speedStr ?? '0') || 0;
  const gusts   = parseFloat(data.maxGusts ?? '0') || 0;
  const wind400 = data.verticalProfile?.find(l => l.alt === '400ft')?.speed ?? 0;
  const visKm   = parseFloat(data.visibility ?? '0') || 0;
  const rain    = data.rainChance ?? 0;

  return [
    {
      label: 'Ráfagas',
      value: `${gusts.toFixed(0)} km/h`,
      threshold: `≤ ${T.gustsBad}`,
      tier: gusts > T.gustsBad ? 'bad' : gusts > T.gustsWarn ? 'warn' : 'good',
    },
    {
      label: 'Viento sup.',
      value: `${sfcWind.toFixed(0)} km/h`,
      threshold: '—',
      tier: 'info',
    },
    {
      label: 'Viento 400 ft',
      value: `${wind400} km/h`,
      threshold: `≤ ${T.wind400Bad}`,
      tier: wind400 > T.wind400Bad ? 'bad' : wind400 > T.wind400Warn ? 'warn' : 'good',
    },
    {
      label: 'Lluvia',
      value: rain > 0 ? `${rain}%` : '0%',
      threshold: '0%',
      tier: rain > 0 ? 'bad' : 'good',
    },
    {
      label: 'Visibilidad',
      value: `${visKm} km`,
      threshold: `≥ ${T.visKmGood}`,
      tier: visKm >= T.visKmGood ? 'good' : 'warn',
    },
    {
      label: 'Techo nubes',
      value: data.cloudBase >= 10000 ? '> 10k ft' : `${data.cloudBase.toLocaleString()} ft`,
      threshold: `≥ ${T.cloudBaseFtGood}`,
      tier: data.cloudBase >= T.cloudBaseFtGood ? 'good' : 'warn',
    },
    {
      label: 'Nubosidad',
      value: `${Math.round(data.clouds)}%`,
      threshold: '—',
      tier: 'info',
    },
    {
      label: 'Temperatura',
      value: `${data.temperature.toFixed(0)}°C`,
      threshold: '—',
      tier: 'info',
    },
    {
      label: 'Punto rocío',
      value: `${data.dewPoint.toFixed(0)}°C`,
      threshold: '—',
      tier: 'info',
    },
    {
      label: 'Satélites GPS',
      value: `${data.satellites}`,
      threshold: `≥ ${T.satellitesGood}`,
      tier: data.satellites >= T.satellitesGood ? 'good' : 'warn',
    },
    {
      label: 'Índice Kp',
      value: data.kpIndex.toFixed(1),
      threshold: `≤ ${T.kpBad}`,
      tier: data.kpIndex > T.kpBad ? 'bad' : data.kpIndex > T.kpWarn ? 'warn' : 'good',
    },
  ];
}
