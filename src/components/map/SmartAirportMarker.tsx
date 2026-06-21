"use client";
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CloudRain, Wind, AlertTriangle, FileText } from 'lucide-react';

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

const HUD_COLORS = {
  vfr: 'var(--color-system-green)',     // Green
  mvfr: 'var(--color-system-blue)',    // Blue
  ifr: 'var(--color-system-red)',     // Red
  lifr: '#8B5CF6',    // Purple
  unknown: '#9ca3af'  // Gray
};

const getCategoryColor = (cat?: string) => {
  if (!cat) return HUD_COLORS.unknown;
  const c = cat.toUpperCase();
  if (c === 'VFR') return HUD_COLORS.vfr;
  if (c === 'MVFR') return HUD_COLORS.mvfr;
  if (c === 'IFR') return HUD_COLORS.ifr;
  if (c === 'LIFR') return HUD_COLORS.lifr;
  return HUD_COLORS.unknown;
};

interface TafShape { rawTAF?: string }
interface NotamShape { id?: string; content?: string }

export default function SmartAirportMarker({ metar, taf, notams }: { metar: MetarData, taf?: TafShape, notams?: NotamShape[] }) {
  const color = getCategoryColor(metar.fltcat);
  
  const dotIcon = L.divIcon({
    className: 'airport-dot',
    html: `<div style="
      width: 12px; height: 12px;
      background: ${color};
      border: 2px solid #000;
      border-radius: 50%;
      box-shadow: 0 0 10px ${color};
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  return (
    <Marker position={[metar.lat, metar.lon]} icon={dotIcon}>
      {/* HOVER TOOLTIP (Windy Style) */}
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <div className="bg-[var(--z-card)] text-[var(--z-text)] p-2 rounded-lg border border-[var(--z-border)] font-medium text-[10px] min-w-[130px] shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--z-border)] pb-1 mb-1">
            <span className="font-bold tracking-wider" style={{ color }}>{metar.icaoId}</span>
            <span className="px-1.5 rounded" style={{ backgroundColor: `${color}30`, color }}>{metar.fltcat || 'UNK'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1"><Wind className="w-3 h-3"/> Viento</span>
              <span>{metar.wspd || 0}KT / {metar.wdir || 0}°</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="">Temp/Rocío</span>
              <span>{metar.temp ?? '--'}° / {metar.dewp ?? '--'}°</span>
            </div>
          </div>
        </div>
      </Tooltip>

      {/* CLICK POPUP (Detailed View) */}
      <Popup>
        <div className="bg-[var(--z-surface)] text-[var(--z-text)] p-4 rounded-xl border border-[var(--z-border)] font-medium text-[11px] w-[320px] max-h-[400px] overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-[10px] tracking-tight mb-0.5">Estación Aeronáutica</div>
              <div className="text-lg font-black tracking-tight" style={{ color }}>{metar.icaoId}</div>
            </div>
            <div className="px-2 py-1 rounded text-[10px] font-bold border" style={{ borderColor: color, color, backgroundColor: `${color}15` }}>
              {metar.fltcat || 'Unknown'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <div className="text-[9px] mb-1">Visibilidad</div>
              <div className="font-bold">{metar.visib ? `${metar.visib} SM` : 'N/A'}</div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <div className="text-[9px] mb-1">Temperatura</div>
              <div className="font-bold">{metar.temp ?? '--'}°C</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* METAR */}
            <div>
              <div className="text-[10px] text-[var(--z-muted)] tracking-tight mb-1.5 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5" /> METAR (Actual)
              </div>
              <div className="p-2 bg-[var(--z-card)] rounded border border-[var(--z-border)] text-[10px] text-gray-300 leading-relaxed">
                {metar.rawOb || 'No METAR available'}
              </div>
            </div>

            {/* TAF */}
            <div>
              <div className="text-[10px] text-[var(--color-system-green)] tracking-tight mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> TAF (Pronóstico)
              </div>
              <div className="p-2 bg-[var(--z-card)] rounded border border-[var(--z-border)] text-[10px] text-gray-300 leading-relaxed max-h-[80px] overflow-y-auto">
                {taf?.rawTAF || 'No TAF available para esta estación.'}
              </div>
            </div>

            {/* NOTAMs */}
            <div>
              <div className="text-[10px] text-[var(--color-system-orange)] tracking-tight mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> NOTAMs Activos
              </div>
              {notams && notams.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {notams.map((n, i) => (
                    <div key={i} className="p-2 bg-[var(--color-system-orange)]/10 rounded border border-[var(--color-system-orange)]/20 text-[10px] text-gray-300 leading-relaxed">
                      <span className="text-[var(--color-system-orange)] font-bold mr-1">{n.id}:</span> {n.content}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 bg-[var(--z-card)] rounded border border-[var(--z-border)] text-[10px] text-gray-500">
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
