"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Plane, PlaneTakeoff, Search, X, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchLiveTelemetry } from "@/lib/api/telemetry";
import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { getMockTelemetry } from "@/lib/api/weatherMock";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Atomic Components
import CopilotStatus from "@/components/telemetry/CopilotStatus";
import NoFlyZones from "@/components/telemetry/NoFlyZones";
import NotamAlert from "@/components/telemetry/NotamAlert";
// SigmetAlert removed from drone HUD — SIGMETs cover FL100-FL450 (10k-45k ft),
// not relevant for drone ops (<400 ft). Keep for future fixed-wing fork.
// import SigmetAlert from "@/components/telemetry/SigmetAlert";
import GpsSatelliteStatus from "@/components/telemetry/GpsSatelliteStatus";
import WindCompass from "@/components/telemetry/WindCompass";
import WeatherCards from "@/components/telemetry/WeatherCards";
import FlightWindow from "@/components/telemetry/FlightWindow";
import FlightLog from "@/components/telemetry/FlightLog";
import FlightAnalytics from "@/components/telemetry/FlightAnalytics";
import AtmosphereCards from "@/components/telemetry/AtmosphereCards";
import PushNotificationManager from "@/components/ui/PushNotificationManager";
import BottomNav from "@/components/navigation/BottomNav";
import MetarBoard from "@/components/weather/MetarBoard";
import ForecastBar8Day from "@/components/weather/ForecastBar8Day";
import ForecastCards from "@/components/weather/ForecastCards";

// FIX: Leaflet SSR Error - Import Map component ONLY on client
const InteractiveMapView = dynamic(() => import("@/components/map/InteractiveMapView"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[var(--z-card)] animate-pulse flex items-center justify-center font-medium text-[10px] text-[var(--z-muted)]">INICIALIZANDO RADAR...</div>
});

import UserMenu from "@/components/ui/UserMenu";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function Home() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lon: number} | null>(null);
  const [viewingAirport, setViewingAirport] = useState<{icao: string; name: string; lat: number; lon: number} | null>(null);
  const [icaoInput, setIcaoInput] = useState('');
  const [icaoLoading, setIcaoLoading] = useState(false);
  const [icaoError, setIcaoError] = useState('');

  const { activeProfile, telemetryData, setTelemetryData, setLoadingTelemetry, setOfflineMode } = useStore();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    // Tracks which source last wrote telemetry — GPS always wins over IP,
    // and once GPS has written we ignore any straggling IP response so the
    // user never sees their precise location replaced by their carrier's
    // IP-geo guess.
    let lastSource: 'none' | 'ip' | 'gps' = 'none';

    const bootAvionics = async () => {
      // Mostrar skeleton inmediatamente, sin bloquear
      const mock = getMockTelemetry('dron');
      setTelemetryData(mock);

      const loadTelemetry = async (source: 'ip' | 'gps', lat: number, lon: number, acc: number) => {
        // GPS supersedes IP — drop late IP writes that arrive after a GPS fix.
        if (source === 'ip' && lastSource === 'gps') return;
        setCoords({ lat, lon });
        setLoadingTelemetry(true);
        try {
          const data = await fetchLiveTelemetry(activeProfile, lat, lon, acc);
          if (cancelled) return;
          // Re-check ordering after the await — GPS may have landed mid-flight.
          if (source === 'ip' && lastSource === 'gps') return;
          if (data) {
            lastSource = source;
            setTelemetryData(data);
            setOfflineMode(false);
          } else {
            // fetchLiveTelemetry returned null (API error / malformed) — surface as offline
            setOfflineMode(true);
          }
        } catch {
          if (!cancelled) setOfflineMode(true);
        } finally {
          if (!cancelled) setLoadingTelemetry(false);
        }
      };

      // IP geolocation — prefer Vercel edge headers (zero-latency, no CORS,
      // no rate limit, works everywhere). Fall back to a single CORS-friendly
      // external service only if the edge headers are missing (local dev or
      // non-Vercel runtime). Every fetch has a 5s timeout so the boot never
      // hangs on a stalled upstream.
      const getLocationByIP = async (): Promise<{lat: number; lon: number} | null> => {
        // 1) Vercel edge geo (preferred — always reachable, always fast)
        try {
          const r = await fetchWithTimeout('/api/geo', { cache: 'no-store' }, 3000);
          if (r.ok) {
            const d = await r.json() as {ok?: boolean; lat?: number; lon?: number};
            if (d.ok && typeof d.lat === 'number' && typeof d.lon === 'number') {
              return { lat: d.lat, lon: d.lon };
            }
          }
        } catch { /* fall through to external fallback */ }

        // 2) External fallback — ipwho.is has the most permissive CORS of the
        // free-tier IP services and ships HTTPS without a paid plan. Wrapped
        // in a 5s timeout so a stalled response never blocks boot.
        try {
          const r = await fetchWithTimeout('https://ipwho.is/', {}, 5000);
          const d = await r.json() as {latitude?: number; longitude?: number; success?: boolean};
          if (d.success && d.latitude && d.longitude) return { lat: d.latitude, lon: d.longitude };
        } catch { /* fall through */ }

        return null;
      };

      // GPS del navegador como promesa con timeout
      const getGPS = (): Promise<{lat: number; lon: number; acc: number} | null> =>
        new Promise((resolve) => {
          if (!('geolocation' in navigator)) { resolve(null); return; }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy }),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
          // Fallback si el browser no dispara el callback en 9s
          setTimeout(() => resolve(null), 9000);
        });

      // Lanzar ambos en paralelo — IP da telemetría rápida mientras GPS
      // arranca; GPS la sobreescribe cuando llega.
      let ipDone = false;
      let gpsDone = false;
      let ipLoc: {lat: number; lon: number} | null = null;
      let gpsLoc: {lat: number; lon: number; acc: number} | null = null;

      getLocationByIP().then((loc) => {
        if (cancelled) return;
        ipDone = true;
        ipLoc = loc;
        if (loc && lastSource !== 'gps') {
          setGpsCoords({ lat: loc.lat, lon: loc.lon });
          loadTelemetry('ip', loc.lat, loc.lon, 5000);
        } else if (gpsDone && !gpsLoc && !loc) {
          // Both sources failed — keep mock, mark offline
          setOfflineMode(true);
          setLoadingTelemetry(false);
        }
      });

      getGPS().then((loc) => {
        if (cancelled) return;
        gpsDone = true;
        gpsLoc = loc;
        if (loc) {
          setGpsCoords({ lat: loc.lat, lon: loc.lon });
          loadTelemetry('gps', loc.lat, loc.lon, loc.acc);
        } else if (ipDone && !ipLoc) {
          // Both sources failed — keep mock, mark offline
          setOfflineMode(true);
          setLoadingTelemetry(false);
        }
      });
    };

    bootAvionics();
    return () => { cancelled = true; };
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
    } catch {
      setOfflineMode(true);
    }
    setLoadingTelemetry(false);
  };

  const profileLabel = t('profile_dron');

  // Convert decimal degrees to aeronautical format: 4.7110 → "04°42'40"N"
  const toAeronautical = (decimal: number, isLat: boolean): string => {
    const sign = decimal < 0 ? (isLat ? 'S' : 'W') : (isLat ? 'N' : 'E');
    const abs = Math.abs(decimal);
    const deg = Math.floor(abs);
    const minTotal = (abs - deg) * 60;
    const min = Math.floor(minTotal);
    const sec = Math.round((minTotal - min) * 60);
    const degStr = String(deg).padStart(isLat ? 2 : 3, '0');
    return `${degStr}°${String(min).padStart(2, '0')}'${String(sec).padStart(2, '0')}"${sign}`;
  };

  const handleIcaoSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = icaoInput.trim();
    if (query.length < 2) {
      setIcaoError('Ingresa al menos 2 letras');
      return;
    }
    setIcaoLoading(true);
    setIcaoError('');
    try {
      // 1. Si son 4 letras, intentar primero como Aeropuerto (OACI)
      if (query.length === 4) {
        const code = query.toUpperCase();
        const res = await fetch(`/api/airport?icao=${code}`);
        if (res.ok) {
          const airport = await res.json() as { icao: string; name: string; lat: number; lon: number };
          setViewingAirport({ icao: airport.icao, name: airport.name, lat: airport.lat, lon: airport.lon });
          setIcaoInput('');
          await handleSyncLocation(airport.lat, airport.lon);
          setIcaoLoading(false);
          return;
        }
      }

      // 2. Búsqueda de Población / Ciudad usando Open-Meteo Geocoding
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es&format=json`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const city = geoData.results[0];
          const name = `${city.name}, ${city.country || city.admin1 || ''}`.replace(/, $/, '');
          setViewingAirport({ icao: 'MAPA', name: name, lat: city.latitude, lon: city.longitude });
          setIcaoInput('');
          await handleSyncLocation(city.latitude, city.longitude);
          setIcaoLoading(false);
          return;
        }
      }

      setIcaoError(`No se encontró aeropuerto o población: ${query}`);
    } catch {
      setIcaoError('Error de red. Intenta de nuevo.');
    }
    setIcaoLoading(false);
  };

  const exitAirportView = async () => {
    setViewingAirport(null);
    if (gpsCoords) await handleSyncLocation(gpsCoords.lat, gpsCoords.lon);
  };

  if (!telemetryData) return null;

  // Resolve effective location once — avoids the same fallback expression
  // spread across six call sites and prevents location-dependent components
  // from firing with lat=0,lon=0 (an ocean tile off Africa) when neither
  // GPS nor IP geo have resolved yet.
  const effectiveLat = telemetryData.gps?.lat ?? coords?.lat ?? null;
  const effectiveLon = telemetryData.gps?.lon ?? coords?.lon ?? null;
  const hasLocation = effectiveLat !== null && effectiveLon !== null;

  // Demo mode banner (shown when offline fallback triggered)
  const isDemo = !telemetryData.gps?.lat && !coords;

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-8 font-sans theme-transition"
      style={{ backgroundColor: 'var(--z-bg)' }}>
      <main className="w-full max-w-[430px] h-[100dvh] md:h-[932px] relative overflow-hidden md:rounded-[3rem] shadow-2xl flex flex-col items-center border-[10px] md:border-x-[12px] md:border-y-[24px] theme-transition"
        style={{
          backgroundColor: 'var(--z-surface)',
          borderColor: 'var(--z-bg)',
          boxShadow: 'var(--z-shadow)',
        }}>
        
        {/* Background Grid - only in dark mode */}
        {isDark && <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />}
        
        <div className="w-full h-full overflow-y-auto px-5 pt-3 pb-36 scrollbar-hide flex flex-col gap-3 relative z-10 transition-all" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          
          {/* Demo mode banner */}
          {isDemo && (
            <div className="rounded-[16px] px-3 py-2.5 mb-1 flex items-center gap-2 shrink-0"
              style={{ background: 'var(--z-card)', border: '0.5px solid var(--z-border)' }}>
              <span className="text-[12px] font-medium" style={{ color: 'var(--color-system-orange)' }}>
                ⚠️ Modo Demo — Sin señal GPS
              </span>
            </div>
          )}

          {/* Main App Header */}
          <header className="flex justify-between items-center shrink-0 mb-2">
            <div className="flex items-center">
              <div className="flex items-center justify-center shrink-0">
                <img src="/logo.svg" alt="Zefyrio Logo" className="h-6 w-auto scale-[2.5] origin-left object-contain" />
              </div>
            </div>
            <UserMenu />
          </header>

          {/* Location Bar — current coords OR airport badge */}
          {viewingAirport ? (
            <div className="rounded-[16px] px-3 py-2.5 flex items-center gap-2 shrink-0"
              style={{ background: 'var(--z-card)', border: '0.5px solid var(--z-border)', boxShadow: 'var(--z-shadow)' }}>
              <Plane className="w-4 h-4 shrink-0" style={{ color: 'var(--color-system-orange)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-black tracking-wider" style={{ color: 'var(--color-system-orange)' }}>
                    {viewingAirport.icao}
                  </span>
                  <span className="text-[10px] truncate" style={{ color: 'var(--z-text)' }}>
                    {viewingAirport.name}
                  </span>
                </div>
                <span className="text-[9px] font-medium" style={{ color: 'var(--z-text)' }}>
                  {toAeronautical(viewingAirport.lat, true)}  {toAeronautical(viewingAirport.lon, false)}
                </span>
              </div>
              <button
                onClick={exitAirportView}
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition"
                title="Volver a mi ubicación"
              >
                <X className="w-4 h-4" style={{ color: 'var(--color-system-orange)' }} />
              </button>
            </div>
          ) : hasLocation ? (
            <div className="rounded-[16px] px-3 py-2 flex items-center gap-2 shrink-0"
              style={{ background: 'var(--z-glass-bg)', border: '1px solid var(--z-border)', boxShadow: 'var(--z-shadow)' }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--z-cyan)' }} />
              <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--z-text)' }}>
                {toAeronautical(effectiveLat as number, true)}  {toAeronautical(effectiveLon as number, false)}
              </span>
              <span className="ml-auto text-[8px] tracking-tight" style={{ color: 'var(--z-cyan)' }}>
                MI POSICIÓN
              </span>
            </div>
          ) : null}

          {/* ICAO Airport Search */}
          <form onSubmit={handleIcaoSearch} className="shrink-0">
            <div className="flex items-center gap-2 rounded-[16px] px-3 py-2 transition-all"
              style={{
                background: 'var(--z-glass-bg)',
                border: `1px solid ${icaoError ? 'var(--color-system-red)' : 'var(--z-border)'}`,
                boxShadow: 'var(--z-shadow)'
              }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--z-muted)' }} />
              <input
                type="text"
                value={icaoInput}
                onChange={(e) => { setIcaoInput(e.target.value); setIcaoError(''); }}
                placeholder="Aeropuerto (SKBO) o Población (Guatapé)"
                className="flex-1 bg-transparent outline-none text-[13px] font-medium tracking-wide placeholder:text-gray-500"
                style={{ color: 'var(--z-text)' }}
              />
              <button
                type="submit"
                disabled={icaoLoading || icaoInput.trim().length < 2}
                className="shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all disabled:opacity-50"
                style={{ background: 'var(--z-cyan)', color: '#ffffff' }}
              >
                {icaoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </div>
            {icaoError && (
              <p className="text-[10px] mt-1 px-1" style={{ color: 'var(--color-system-red)' }}>{icaoError}</p>
            )}
          </form>

          {/* TELEMETRY TAB */}
          {activeTab === 'telemetry' && (
             <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
                <CopilotStatus
                  status={telemetryData.status}
                  aiMessage={telemetryData.aiMessage}
                  profileLabel={profileLabel}
                  data={telemetryData}
                />
                
                {/* TFR / NO-FLY ZONES — skip while we have no real location */}
                {hasLocation && (
                  <NoFlyZones lat={effectiveLat as number} lon={effectiveLon as number} />
                )}

                {/* NOTAM ALERTS */}
                {hasLocation && (
                  <NotamAlert lat={effectiveLat as number} lon={effectiveLon as number} />
                )}
      
                <section className="grid grid-cols-2 gap-4 shrink-0">
                  <GpsSatelliteStatus satellites={telemetryData.satellites} kpIndex={telemetryData.kpIndex} />
                  <WindCompass surfaceWind={telemetryData.surfaceWind} maxGusts={telemetryData.maxGusts} />
                  <div className="col-span-2">
                    <WeatherCards temperature={telemetryData.temperature} feelsLike={telemetryData.feelsLike} rainChance={telemetryData.rainChance} clouds={telemetryData.clouds} />
                  </div>
                  <div className="col-span-2">
                    <AtmosphereCards visibility={telemetryData.visibility} cloudBase={telemetryData.cloudBase} />
                  </div>
                  <div className="col-span-2">
                    <FlightWindow sun={telemetryData.sun} />
                  </div>
                </section>
             </div>
          )}

          {/* WEATHER/METAR TAB */}
          {activeTab === 'weather' && hasLocation && (
             <MetarBoard lat={effectiveLat as number} lon={effectiveLon as number} />
          )}

          {/* FORECAST TAB */}
          {activeTab === 'forecast' && hasLocation && (
            <div className="flex-1 w-full flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
              {/* Section header */}
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: '#f97316' }} />
                <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--z-text)' }}>Pronósticos</h2>
                <span className="text-[10px] font-medium" style={{ color: 'var(--z-muted)' }}>8 días</span>
              </div>
              {/* 8-day forecast — rendered inline, not over the map */}
              <div
                className="rounded-2xl border overflow-hidden p-4"
                style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)' }}
              >
                <ForecastBar8Day 
                  lat={effectiveLat as number} 
                  lon={effectiveLon as number} 
                  locationName={viewingAirport ? viewingAirport.name : (telemetryData?.locationName || 'Mi Ubicación')} 
                />
              </div>
              {/* Hourly drone outlook — wind, UV, humidity, visibility */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-system-blue)' }} />
                <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--z-text)' }}>Próximas 24h</h2>
                <span className="text-[10px] font-medium" style={{ color: 'var(--z-muted)' }}>drone outlook</span>
              </div>
              <ForecastCards lat={effectiveLat as number} lon={effectiveLon as number} />
            </div>
          )}

          {/* MAP TAB */}
          {activeTab === 'map' && hasLocation && (
            <div className="flex-1 w-full rounded-3xl overflow-hidden border border-white/5 animate-in fade-in zoom-in duration-500">
              <InteractiveMapView
                initialLat={effectiveLat as number}
                initialLon={effectiveLon as number}
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

        {/* Portal target for modals — keeps them inside the phone frame */}
        <div id="phone-modal-root" className="absolute inset-0 pointer-events-none z-[60]" />
      </main>
    </div>
  );
}
