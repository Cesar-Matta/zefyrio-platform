import { create } from 'zustand'

export type PilotProfile = 'dron' | 'helicopter' | 'paraglider' | 'parachute' | 'plane';

interface AppState {
  activeProfile: PilotProfile;
  setProfile: (profile: PilotProfile) => void;
  
  telemetryData: any | null;
  setTelemetryData: (data: any) => void;
  isLoadingTelemetry: boolean;
  setLoadingTelemetry: (loading: boolean) => void;
  
  isOfflineMode: boolean;
  setOfflineMode: (status: boolean) => void;
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
}));
