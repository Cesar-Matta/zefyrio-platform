"use client";
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CloudRain, Wind, AlertTriangle, FileText, Radio, Plane } from 'lucide-react';

interface MetarData {
  icaoId: string;
  name?: string;
  lat: number;
  lon: number;
  temp?: number;
  dewp?: number;
  wspd?: number;
  wdir?: number;
  visib?: number;
  rawOb: string;
  fltcat?: string;
}

// Extra info from local Colombia airports GeoJSON
interface AirportInfo {
  name?: string;
  iataCode?: string;
  elevation?: { value?: number; unit?: number };
  runways?: Array<{ designator?: string; dimension?: { length?: { value?: number }; width?: { value?: number } }; surface?: { mainComposite?: number } }>;
  frequencies?: Array<{ value?: number; name?: string; type?: number }>;
  private?: boolean;
  ppr?: boolean;
}

const HUD_COLORS = {
  vfr:     'var(--color-system-green)',
  mvfr:    'var(--color-system-blue)',
  ifr:     'var(--color-system-red)',
  lifr:    '#8B5CF6',
  unknown: '#94a3b8'
};

const getCategoryColor = (cat?: string) => {
  if (!cat) return HUD_COLORS.unknown;
  const c = cat.toUpperCase();
  if (c === 'VFR')  return HUD_COLORS.vfr;
  if (c === 'MVFR') return HUD_COLORS.mvfr;
  if (c === 'IFR')  return HUD_COLORS.ifr;
  if (c === 'LIFR') return HUD_COLORS.lifr;
  return HUD_COLORS.unknown;
};

const surfaceLabel = (code?: number) => {
  const m: Record<number, string> = { 0: 'Asfalto', 1: 'Concreto', 2: 'Grama', 3: 'Tierra', 4: 'Gravilla' };
  return code != null ? (m[code] ?? 'Desconocido') : '—';
};

interface TafShape { rawTAF?: string }
interface NotamShape { id?: string; content?: string }

export default function SmartAirportMarker({
  metar, taf, notams, airportInfo
}: {
  metar: MetarData;
  taf?: TafShape;
  notams?: NotamShape[];
  airportInfo?: AirportInfo;
}) {
  const color = getCategoryColor(metar.fltcat);

  const dotIcon = L.divIcon({
    className: 'airport-dot',
    html: `<div style="
      width: 12px; height: 12px;
      background: ${color};
      border: 2px solid rgba(0,0,0,0.6);
      border-radius: 50%;
      box-shadow: 0 0 10px ${color};
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const displayName = airportInfo?.name || metar.name || metar.icaoId;

  return (
    <Marker position={[metar.lat, metar.lon]} icon={dotIcon}>
      {/* HOVER TOOLTIP */}
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <div style={{ background: 'var(--z-card)', color: 'var(--z-text)', border: '1px solid var(--z-border)' }}
          className="p-2 rounded-lg font-medium text-[10px] min-w-[140px] shadow-xl">
          <div className="flex justify-between items-center border-b pb-1 mb-1" style={{ borderColor: 'var(--z-border)' }}>
            <span className="font-black tracking-wider text-[11px]" style={{ color }}>{metar.icaoId}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${color}25`, color }}>{metar.fltcat || 'UNK'}</span>
          </div>
          <div className="text-[9px] mb-1.5 opacity-75 truncate max-w-[140px]">{displayName}</div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="opacity-70 flex items-center gap-1"><Wind className="w-3 h-3"/>Viento</span>
              <span className="font-semibold">{metar.wspd ?? 0}KT / {metar.wdir ?? 0}°</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Temp/Rocío</span>
              <span className="font-semibold">{metar.temp ?? '--'}° / {metar.dewp ?? '--'}°</span>
            </div>
          </div>
        </div>
      </Tooltip>

      {/* CLICK POPUP */}
      <Popup>
        <div style={{ background: 'var(--z-surface)', color: 'var(--z-text)', border: '1px solid var(--z-border)' }}
          className="p-4 rounded-xl font-medium text-[11px] w-[320px] max-h-[480px] overflow-y-auto">

          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-[9px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: 'var(--z-muted)' }}>
                Estación Aeronáutica
              </div>
              <div className="text-xl font-black tracking-tight leading-none" style={{ color }}>{metar.icaoId}</div>
              {airportInfo?.iataCode && (
                <div className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--z-muted)' }}>IATA: {airportInfo.iataCode}</div>
              )}
              {displayName && displayName !== metar.icaoId && (
                <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--z-text)', opacity: 0.7 }}>{displayName}</div>
              )}
            </div>
            <div className="px-2 py-1 rounded-lg text-[10px] font-black border shrink-0"
              style={{ borderColor: color, color, backgroundColor: `${color}18` }}>
              {metar.fltcat || 'UNKN'}
            </div>
          </div>

          {/* Weather stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Visibilidad', value: metar.visib ? `${metar.visib} SM` : 'N/D' },
              { label: 'Temperatura', value: metar.temp != null ? `${metar.temp}°C` : 'N/D' },
              { label: 'Viento', value: `${metar.wspd ?? 0}KT ${metar.wdir ?? 0}°` },
              { label: 'Rocío', value: metar.dewp != null ? `${metar.dewp}°C` : 'N/D' },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 rounded-lg border"
                style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)' }}>
                <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--z-muted)' }}>{label}</div>
                <div className="text-[11px] font-bold" style={{ color: 'var(--z-text)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Colombia airports extra info */}
          {airportInfo && (airportInfo.elevation || (airportInfo.runways && airportInfo.runways.length > 0) || (airportInfo.frequencies && airportInfo.frequencies.length > 0)) && (
            <div className="mb-3 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--z-border)' }}>
              <div className="px-3 py-1.5 text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5"
                style={{ background: 'var(--z-card)', color: 'var(--z-muted)' }}>
                <Plane className="w-3 h-3" /> Datos del Aeródromo
              </div>
              <div className="p-2 flex flex-col gap-2" style={{ background: 'var(--z-surface)' }}>
                {airportInfo.elevation?.value != null && (
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: 'var(--z-muted)' }}>Elevación</span>
                    <span className="font-bold" style={{ color: 'var(--z-text)' }}>{airportInfo.elevation.value} m MSL</span>
                  </div>
                )}
                {airportInfo.ppr && (
                  <div className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>
                    ⚠ PPR — Permiso previo requerido
                  </div>
                )}
                {airportInfo.runways && airportInfo.runways.length > 0 && (
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--z-muted)' }}>Pistas</div>
                    {airportInfo.runways.map((rwy, i) => (
                      <div key={i} className="flex justify-between text-[10px] py-0.5">
                        <span className="font-bold" style={{ color: 'var(--z-text)' }}>{rwy.designator ?? '—'}</span>
                        <span style={{ color: 'var(--z-muted)' }}>
                          {rwy.dimension?.length?.value ?? '?'}×{rwy.dimension?.width?.value ?? '?'}m · {surfaceLabel(rwy.surface?.mainComposite)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {airportInfo.frequencies && airportInfo.frequencies.length > 0 && (
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--z-muted)' }}>
                      <Radio className="w-3 h-3" /> Frecuencias
                    </div>
                    {airportInfo.frequencies.map((f, i) => (
                      <div key={i} className="flex justify-between text-[10px] py-0.5">
                        <span style={{ color: 'var(--z-muted)' }}>{f.name ?? `Freq ${i+1}`}</span>
                        <span className="font-black" style={{ color }}>{f.value} MHz</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* METAR */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--z-muted)' }}>
                <CloudRain className="w-3.5 h-3.5" style={{ color: 'var(--color-system-blue)' }} /> METAR Actual
              </div>
              <div className="p-2.5 rounded-lg border font-mono text-[10px] leading-relaxed"
                style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)', color: 'var(--z-text)' }}>
                {metar.rawOb || 'Sin METAR disponible.'}
              </div>
            </div>

            {/* TAF */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--z-muted)' }}>
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-system-green)' }} /> TAF Pronóstico
              </div>
              <div className="p-2.5 rounded-lg border font-mono text-[10px] leading-relaxed max-h-[90px] overflow-y-auto"
                style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)', color: 'var(--z-text)' }}>
                {taf?.rawTAF || 'Sin TAF disponible para esta estación.'}
              </div>
            </div>

            {/* NOTAMs */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--z-muted)' }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-system-orange)' }} /> NOTAMs Activos
              </div>
              {notams && notams.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {notams.map((n, i) => (
                    <div key={i} className="p-2 rounded-lg border text-[10px] leading-relaxed"
                      style={{ background: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.25)', color: 'var(--z-text)' }}>
                      <span className="font-black mr-1" style={{ color: 'var(--color-system-orange)' }}>{n.id}:</span>
                      {n.content}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg border text-[10px]"
                  style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)', color: 'var(--z-muted)' }}>
                  Sin NOTAMs críticos recientes.
                </div>
              )}
            </div>
          </div>

        </div>
      </Popup>
    </Marker>
  );
}
