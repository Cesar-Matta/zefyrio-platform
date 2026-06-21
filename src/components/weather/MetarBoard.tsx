"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plane, Radio, Wind, AlertTriangle, Radar } from "lucide-react";
import dynamic from 'next/dynamic';
import type { AircraftState } from './RadarMap';
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MetarStation {
  icaoId: string;
  name?: string;
  fltcat?: string;
  rawOb?: string;
  lat?: number;
  lon?: number;
  clouds?: Array<{ base?: number }>;
  [key: string]: unknown;
}

const RadarMap = dynamic(() => import('./RadarMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-[220px] rounded-3xl bg-[var(--z-surface)] border border-[var(--z-border)]/30 animate-pulse flex items-center justify-center text-xs font-medium text-[var(--z-muted)]">Inicializando Enlace Cartográfico Satelital...</div>
});

interface MetarBoardProps {
  lat: number;
  lon: number;
}

export default function MetarBoard({ lat: initialLat, lon: initialLon }: MetarBoardProps) {
  const { t } = useTranslation();
  const [metarList, setMetarList] = useState<MetarStation[]>([]);
  const [selectedMetar, setSelectedMetar] = useState<MetarStation | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── ADS-B State ──────────────────────────────────────────────────────────
  const [aircraftList, setAircraftList] = useState<AircraftState[]>([]);
  const [showAircraft, setShowAircraft] = useState(true);
  const [adsbError, setAdsbError] = useState(false);
  const currentBboxRef = useRef<string | null>(null);
  const adsbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── METAR fetch (acumulativo) ──────────────────────────────────────────────
  const fetchAeroData = useCallback(async (bboxOrLat: string | number, mapLon?: number) => {
    setLoading(true);
    try {
      const query = typeof bboxOrLat === 'string' 
        ? `?bbox=${bboxOrLat}` 
        : `?lat=${bboxOrLat}&lon=${mapLon}`;
      
      if (typeof bboxOrLat === 'string') {
        currentBboxRef.current = bboxOrLat;
      }

      const res = await fetch(`/api/aero${query}`);
      const apiResponse = await res.json();
      
      if (apiResponse.metar) {
        const metars = apiResponse.metar as MetarStation[];
        const uniqueMetars = metars.filter((v, i, a) =>
          a.findIndex(t => t.icaoId === v.icaoId) === i
        );

        setMetarList((prevList) => {
          const combined = [...prevList, ...uniqueMetars];
          const deduplicated = combined.filter((v, i, a) =>
            a.findIndex(t => t.icaoId === v.icaoId) === i
          );
          if (deduplicated.length > 2000) {
            return deduplicated.slice(deduplicated.length - 2000);
          }
          return deduplicated;
        });

        if (uniqueMetars.length > 0) {
          setSelectedMetar((prev) => {
            if (!prev) return uniqueMetars[0];
            const stillExists = uniqueMetars.find((m) => m.icaoId === prev.icaoId);
            return stillExists ?? prev;
          });
        }
      }
    } catch (err) {
      console.error("Aero Proxy fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── ADS-B fetch (polling cada 15s) ────────────────────────────────────────
  const fetchAdsbData = useCallback(async (bbox: string) => {
    try {
      const res = await fetch(`/api/adsb?bbox=${bbox}`);
      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          setAdsbError(true);
          return;
        }
      }
      const data = await res.json();
      setAdsbError(false);
      setAircraftList(data.aircraft || []);
    } catch (err) {
      console.error("[ADS-B] Error:", err);
      setAdsbError(true);
    }
  }, []);

  const startAdsbPolling = useCallback((bbox: string) => {
    fetchAdsbData(bbox);
    if (adsbIntervalRef.current) clearInterval(adsbIntervalRef.current);
    adsbIntervalRef.current = setInterval(() => {
      if (currentBboxRef.current) fetchAdsbData(currentBboxRef.current);
    }, 15_000);
  }, [fetchAdsbData]);

  const handleMapMove = useCallback((bbox: string) => {
    currentBboxRef.current = bbox;
    fetchAeroData(bbox);
    if (showAircraft) startAdsbPolling(bbox);
  }, [fetchAeroData, showAircraft, startAdsbPolling]);

  useEffect(() => {
    fetchAeroData(initialLat, initialLon);
    const delta = 1.5;
    const initialBbox = `${(initialLat - delta).toFixed(2)},${(initialLon - delta).toFixed(2)},${(initialLat + delta).toFixed(2)},${(initialLon + delta).toFixed(2)}`;
    currentBboxRef.current = initialBbox;
    if (showAircraft) startAdsbPolling(initialBbox);
    return () => {
      if (adsbIntervalRef.current) clearInterval(adsbIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLat, initialLon]);

  const toggleAircraft = () => {
    setShowAircraft(prev => {
      const next = !prev;
      if (next && currentBboxRef.current) {
        startAdsbPolling(currentBboxRef.current);
      } else {
        if (adsbIntervalRef.current) clearInterval(adsbIntervalRef.current);
        setAircraftList([]);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 w-full">
      
      {/* Controles del Radar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] font-medium text-gray-500 tracking-tight">
          {t('metar_tactical_radar')}
        </span>
        <button
          onClick={toggleAircraft}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-medium tracking-tight transition-all ${
            showAircraft 
              ? 'border-[var(--color-system-green)]/50 bg-[var(--color-system-green)]/10 text-[var(--color-system-green)]' 
              : 'border-[var(--z-border)] bg-white/5 text-gray-500'
          }`}
        >
          <Radar className="w-3 h-3" />
          ADS-B {showAircraft ? 'ON' : 'OFF'}
          {showAircraft && aircraftList.length > 0 && (
            <span className="ml-1 bg-[var(--color-system-green)]/20 text-[var(--color-system-green)] px-1.5 py-0.5 rounded-full text-[8px]">
              {aircraftList.length}
            </span>
          )}
        </button>
      </div>

      {/* Mapa Táctico Interactivo */}
      <RadarMap 
        initialLat={initialLat}
        initialLon={initialLon}
        metarList={metarList}
        selectedIcao={selectedMetar?.icaoId || null}
        onSelect={setSelectedMetar}
        onMapMove={handleMapMove}
        aircraftList={aircraftList}
        showAircraft={showAircraft}
      />

      {/* Indicador de error ADS-B (no intrusivo) */}
      {adsbError && showAircraft && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-system-orange)]/10 border border-[var(--color-system-orange)]/20">
          <Radar className="w-3 h-3 text-[var(--color-system-orange)] shrink-0" />
          <span className="text-[9px] font-medium text-[var(--color-system-orange)]">{t('metar_adsb_limit')}</span>
        </div>
      )}

      {loading && metarList.length === 0 && (
        <div className="p-8 text-center text-[var(--z-muted)] font-medium text-xs animate-pulse">
          {t('metar_scanning')}
        </div>
      )}

      {!loading && metarList.length === 0 && (
        <div className="glass-panel p-6 rounded-3xl bg-[#111625]/50 border-[var(--z-border)] flex flex-col items-center text-center">
          <AlertTriangle className="w-8 h-8 text-plasma-warn mb-3" />
          <span className="text-sm text-gray-400 font-medium">{t('metar_no_stations')}</span>
        </div>
      )}

      {/* METAR DETALLE */}
      {selectedMetar && (
        <div className="glass-panel p-6 rounded-3xl relative bg-[#111625]/50 border-[var(--z-border)] overflow-hidden shadow-2xl shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                {t('metar_base_station')}
              </span>
              <span className="text-3xl font-black text-[var(--z-text)] tracking-tight">{selectedMetar.icaoId}</span>
              <span className="text-[10px] text-[var(--z-muted)] font-medium mt-1 drop-shadow-md tracking-wider">
                {selectedMetar.name || t('metar_airport')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[var(--z-surface)]/10 flex items-center justify-center border border-[var(--z-border)]/30 shrink-0">
              <Radio className={`w-5 h-5 text-[var(--z-muted)] ${loading ? 'animate-ping' : 'animate-pulse'}`} />
            </div>
          </div>

          <div className="bg-[var(--z-card)] rounded-xl p-4 border border-white/5 font-medium text-sm text-gray-300 leading-relaxed tracking-tight shadow-inner break-words">
            <span className="text-radium-go font-bold">{t('metar_raw')} </span>
            <br/>
            <span className="leading-7">{selectedMetar.rawOb}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition cursor-pointer">
              <Plane className="w-6 h-6 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 tracking-tight">{t('metar_flight_cat')}</span>
                <span className={`font-black ${selectedMetar.fltcat === 'VFR' ? 'text-radium-go drop-shadow-[0_0_5px_var(--color-system-green)]' : selectedMetar.fltcat === 'IFR' || selectedMetar.fltcat === 'LIFR' ? 'text-crimson-nogo drop-shadow-[0_0_5px_var(--color-system-red)]' : 'text-plasma-warn drop-shadow-[0_0_5px_var(--color-system-orange)]'}`}>
                  {selectedMetar.fltcat || 'VFR'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition cursor-pointer">
              <Wind className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 tracking-tight">{t('metar_cloud_ceiling')}</span>
                <span className="font-black text-[var(--z-text)] text-xs">
                  {selectedMetar.clouds?.[0]?.base ? `${selectedMetar.clouds[0].base}00 ft` : t('metar_ceiling_clear')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
