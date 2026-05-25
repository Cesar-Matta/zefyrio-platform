"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Activity, MapPin } from "lucide-react";
import { DroneIcon } from "@/components/ui/AircraftIcons";
import { useStore } from "@/store/useStore";
import { fetchLiveTelemetry } from "@/lib/api/telemetry";
import { getMockTelemetry } from "@/lib/api/weatherMock";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Atomic Components
import CopilotStatus from "@/components/telemetry/CopilotStatus";
import NoFlyZones from "@/components/telemetry/NoFlyZones";
import NotamAlert from "@/components/telemetry/NotamAlert";
import SigmetAlert from "@/components/telemetry/SigmetAlert";
import VerticalWindProfile from "@/components/telemetry/VerticalWindProfile";
import GpsSatelliteStatus from "@/components/telemetry/GpsSatelliteStatus";
import WindCompass from "@/components/telemetry/WindCompass";
import WeatherCards from "@/components/telemetry/WeatherCards";
import FlightWindow from "@/components/telemetry/FlightWindow";
import FlightLog from "@/components/telemetry/FlightLog";
import FlightAnalytics from "@/components/telemetry/FlightAnalytics";
import PushNotificationManager from "@/components/ui/PushNotificationManager";
import BottomNav from "@/components/navigation/BottomNav";
import MetarBoard from "@/components/weather/MetarBoard";
import ForecastBar8Day from "@/components/weather/ForecastBar8Day";
import ForecastCards from "@/components/weather/ForecastCards";

// FIX: Leaflet SSR Error - Import Map component ONLY on client
const InteractiveMapView = dynamic(() => import("@/components/map/InteractiveMapView"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/20 animate-pulse flex items-center justify-center font-mono text-[10px] text-white/40">INICIALIZANDO RADAR...</div>
});

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function Home() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [gpsError, setGpsError] = useState('');
  const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);
  
  const { activeProfile, telemetryData, setTelemetryData, isLoadingTelemetry, setLoadingTelemetry, setOfflineMode } = useStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    // Escaneo Asíncrono Local & Red
    const bootAvionics = async () => {
      setLoadingTelemetry(true);
      
      const handleSuccess = async (lat: number, lon: number, acc: number) => {
         try {
             setCoords({ lat, lon });
             const data = await fetchLiveTelemetry(activeProfile, lat, lon, acc);
             if (data) setTelemetryData(data);
             else throw new Error("API Fallbox");
             setOfflineMode(false);
             setGpsError(''); // Borrar error visual si lo hubo antes
         } catch {
             setOfflineMode(true);
             setGpsError(t('meteo_no_response'));
         }
         setLoadingTelemetry(false);
      };

      const handleFallback = async (reason: string) => {
         // Si el GPS falla (denied, timeout), intentar Triangular por IP
         setGpsError(`${reason} - Triangulando por IP...`);
         try {
             const res = await fetch('https://ipapi.co/json/');
             const ipData = await res.json() as { latitude?: number; longitude?: number };
             if (ipData.latitude && ipData.longitude) {
                 await handleSuccess(ipData.latitude, ipData.longitude, 5000); // 5km precision IP
             } else {
                 throw new Error("No se pudo triangular");
             }
         } catch {
             // Último recurso: modo demo con datos mock
             const mock = getMockTelemetry('dron');
             setTelemetryData(mock);
             setGpsError(t('gps_no_signal'));
             setOfflineMode(true);
             setLoadingTelemetry(false);
         }
      };

      if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => handleSuccess(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
            (error) => handleFallback(`GPS Denegado/Timeout (${error.message})`),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
      } else {
        handleFallback(t('gps_no_support'));
      }
    };
    
    bootAvionics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSyncLocation = async (lat: number, lon: number) => {
    setActiveTab('telemetry'); // Go back to HUD
    setLoadingTelemetry(true);
    try {
      setCoords({ lat, lon });
      const data = await fetchLiveTelemetry(activeProfile, lat, lon, 5000);
      if (data) setTelemetryData(data);
      setOfflineMode(false);
      setGpsError('');
    } catch {
      setOfflineMode(true);
      setGpsError(t('meteo_no_response'));
    }
    setLoadingTelemetry(false);
  };

  const profileLabel = t('profile_dron');

  if (isLoadingTelemetry || !telemetryData) {
    return (
        <div className="min-h-screen flex flex-col gap-4 items-center justify-center font-mono text-xs uppercase animate-pulse theme-transition"
          style={{ backgroundColor: 'var(--z-bg)', color: 'var(--z-cyan)' }}>
            <MapPin className="w-8 h-8 opacity-50 mb-2 animate-bounce" />
            <span style={{ color: 'var(--z-text)' }}><strong>{t('gps_linking')}</strong> {gpsError ? `${t('gps_failed')} ${gpsError}` : t('gps_searching')}</span>
            {!gpsError && <span className="text-[10px] opacity-70">{t('gps_syncing')}</span>}
        </div>
    );
  }

  // Demo mode banner (shown when offline fallback triggered)
  const isDemo = !telemetryData.gps?.lat && !coords;

  const statusBg = telemetryData.status === 'GO' ? 'bg-radium-go' : 
                   telemetryData.status === 'CAUTION' ? 'bg-plasma-warn' : 
                   'bg-crimson-nogo';

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-8 font-sans theme-transition"
      style={{ backgroundColor: isDark ? '#050505' : '#e2e8f0' }}>
      <main className="w-full max-w-[430px] h-[100dvh] md:h-[932px] relative overflow-hidden md:rounded-[3rem] shadow-2xl flex flex-col items-center border-[10px] md:border-x-[12px] md:border-y-[24px] theme-transition"
        style={{
          backgroundColor: 'var(--z-surface)',
          borderColor: isDark ? '#0a0a0a' : '#cbd5e1',
          boxShadow: 'var(--z-shadow)',
        }}>
        
        {/* Background Grid - only in dark mode */}
        {isDark && <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />}
        
        <div className="w-full h-full overflow-y-auto px-5 pt-10 pb-36 scrollbar-hide flex flex-col gap-5 relative z-10 transition-all">
          
          {/* Demo mode banner */}
          {isDemo && (
            <div className="rounded-xl px-3 py-2 mb-1 flex items-center gap-2 shrink-0"
              style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.35)' }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#ffb800' }}>
                ⚠️ Modo Demo — Sin señal GPS
              </span>
            </div>
          )}

          {/* Main App Header */}
          <header className="flex justify-between items-center mb-1 shrink-0">
            <div>
              <h1 className="text-3xl font-black tracking-tighter font-heading" style={{ color: 'var(--z-text)', letterSpacing: '-0.03em' }}>ZEFYRIO</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-[var(--z-cyan)]/10 border-[var(--z-cyan)] shadow-[0_0_10px_var(--z-cyan)]">
                  <DroneIcon className="w-3 h-3" style={{ color: 'var(--z-cyan)' }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--z-cyan)' }}>
                    Drone HUD
                  </span>
                </div>
              </div>
            </div>
            {/* Header Right: Theme Toggle + Status */}
            <div className="flex items-center gap-2">
              <LocaleToggle size="sm" />
              <ThemeToggle size="sm" />
              <button className="w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md relative shrink-0 cursor-pointer"
                style={{ backgroundColor: 'var(--z-glass-bg)', border: '1px solid var(--z-border)' }}>
                <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full ${statusBg} animate-pulse`} 
                  style={{ border: '2px solid var(--z-surface)' }} />
                <Activity className="w-4 h-4" style={{ color: 'var(--z-text)' }} />
              </button>
            </div>
          </header>

          {/* TELEMETRY TAB */}
          {activeTab === 'telemetry' && (
             <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
                <CopilotStatus 
                  status={telemetryData.status} 
                  aiMessage={telemetryData.aiMessage} 
                  profileLabel={profileLabel} 
                />
                
                {/* TFR / NO-FLY ZONES */}
                <NoFlyZones 
                  lat={telemetryData.gps?.lat || coords?.lat || 0} 
                  lon={telemetryData.gps?.lon || coords?.lon || 0} 
                />
                
                {/* NOTAM ALERTS */}
                <NotamAlert 
                  lat={telemetryData.gps?.lat || coords?.lat || 0} 
                  lon={telemetryData.gps?.lon || coords?.lon || 0} 
                />

                {/* SIGMET / AIRMET ALERTS */}
                <SigmetAlert 
                  lat={telemetryData.gps?.lat || coords?.lat || 0} 
                  lon={telemetryData.gps?.lon || coords?.lon || 0} 
                />

                <VerticalWindProfile 
                  verticalProfile={telemetryData.verticalProfile} 
                />
      
                <section className="grid grid-cols-2 gap-4 shrink-0">
                  <GpsSatelliteStatus satellites={telemetryData.satellites} kpIndex={telemetryData.kpIndex} />
                  <WindCompass surfaceWind={telemetryData.surfaceWind} maxGusts={telemetryData.maxGusts} />
                  <WeatherCards temperature={telemetryData.temperature} feelsLike={telemetryData.feelsLike} rainChance={telemetryData.rainChance} clouds={telemetryData.clouds} />
                  <FlightWindow sun={telemetryData.sun} />
                </section>
             </div>
          )}

          {/* WEATHER/METAR TAB */}
          {activeTab === 'weather' && (telemetryData.gps || coords) && (
             <MetarBoard 
               lat={telemetryData.gps?.lat || coords?.lat || 0} 
               lon={telemetryData.gps?.lon || coords?.lon || 0} 
             />
          )}
 
          {/* FORECAST TAB */}
          {activeTab === 'forecast' && (telemetryData.gps || coords) && (
            <div className="flex-1 w-full flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
              {/* Section header */}
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: '#f97316' }} />
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--z-text)' }}>Pronósticos</h2>
                <span className="text-[10px] font-mono" style={{ color: 'var(--z-muted)' }}>8 días</span>
              </div>
              {/* 8-day forecast — rendered inline, not over the map */}
              <div
                className="rounded-2xl border overflow-x-auto no-scrollbar p-4"
                style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)' }}
              >
                <ForecastBar8Day 
                  lat={telemetryData.gps?.lat || coords?.lat || 0} 
                  lon={telemetryData.gps?.lon || coords?.lon || 0} 
                />
              </div>
              {/* Hourly drone outlook — wind, UV, humidity, visibility */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1 h-5 rounded-full" style={{ background: '#00f0ff' }} />
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--z-text)' }}>Próximas 24h</h2>
                <span className="text-[10px] font-mono" style={{ color: 'var(--z-muted)' }}>drone outlook</span>
              </div>
              <ForecastCards 
                lat={telemetryData.gps?.lat || coords?.lat || 0} 
                lon={telemetryData.gps?.lon || coords?.lon || 0} 
              />
            </div>
          )}

          {/* MAP TAB */}
          {activeTab === 'map' && (
            <div className="flex-1 w-full rounded-3xl overflow-hidden border border-white/5 animate-in fade-in zoom-in duration-500">
              <InteractiveMapView 
                initialLat={telemetryData.gps?.lat || coords?.lat || 0} 
                initialLon={telemetryData.gps?.lon || coords?.lon || 0} 
                onSyncLocation={handleSyncLocation}
              />
            </div>
          )}

          {/* LOG TAB */}
          {activeTab === 'log' && (
            <div className="flex-1 w-full overflow-y-auto px-1 pb-20 flex flex-col gap-4">
              {/* Push Alerts */}
              <PushNotificationManager />
              {/* Session Logger */}
              <FlightLog />
              {/* Analytics Dashboard */}
              <FlightAnalytics />
            </div>
          )}

        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </div>
  );
}
