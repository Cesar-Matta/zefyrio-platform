import { create } from 'zustand'

// Drone-only HUD — single profile for now. Type kept for future expansion.
export type PilotProfile = 'dron';
export type Locale = 'en' | 'es';

export type FlightStatus = 'GO' | 'CAUTION' | 'NO-GO';

export interface SurfaceWind {
  speedStr: string;
  direction: string;
  angle: number;
}

export interface SunData {
  sunrise: string;
  sunset: string;
  progressPercent: number;
}

export interface WindLayer {
  alt: string;
  speed: number;
  state: 'ok' | 'warn' | 'critical' | 'calm';
}

export interface GpsCoords {
  lat: number;
  lon: number;
}

export interface WindForecastHour {
  time: string;
  speed10m: number;
  speed120m: number;
  direction: number;
  gusts: number;
}

export interface KpForecastHour {
  time: string;
  kp: number;
}

export interface TelemetryData {
  timestamp: string;
  status: FlightStatus;
  aiMessage: string;
  surfaceWind: SurfaceWind;
  maxGusts: string;
  satellites: number;
  kpIndex: number;
  visibility: string;
  temperature: number;
  feelsLike: number;
  dewPoint: number;        // °C — fog/condensation risk
  cloudBase: number;       // ft AGL — drone ceiling (Espy formula)
  rainChance: number;
  clouds: number;
  sun: SunData;
  verticalProfile: WindLayer[];
  windForecast?: WindForecastHour[];
  kpForecast?: KpForecastHour[];
  locationName?: string;
  gps?: GpsCoords;
}

interface AppState {
  activeProfile: PilotProfile;
  setProfile: (profile: PilotProfile) => void;

  telemetryData: TelemetryData | null;
  setTelemetryData: (data: TelemetryData) => void;
  isLoadingTelemetry: boolean;
  setLoadingTelemetry: (loading: boolean) => void;

  isOfflineMode: boolean;
  setOfflineMode: (status: boolean) => void;

  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useStore = create<AppState>((set) => ({
  activeProfile: 'dron',
  setProfile: (profile) => set({ activeProfile: profile }),

  telemetryData: null,
  setTelemetryData: (data) => set({ telemetryData: data }),
  isLoadingTelemetry: true,
  setLoadingTelemetry: (loading) => set({ isLoadingTelemetry: loading }),

  isOfflineMode: false,
  setOfflineMode: (status) => set({ isOfflineMode: status }),

  locale: 'es',
  setLocale: (locale) => set({ locale }),
}));
