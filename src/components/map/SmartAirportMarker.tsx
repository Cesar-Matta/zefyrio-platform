"use client";
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';

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
  vfr?: string; // flight_category
}

const HUD_COLORS = {
  vfr: '#00FF66',     // Green
  mvfr: '#00F0FF',    // Blue
  ifr: '#FF0055',     // Red
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

export default function SmartAirportMarker({ metar }: { metar: MetarData }) {
  const color = getCategoryColor(metar.vfr);
  
  const dotIcon = L.divIcon({
    className: 'airport-dot',
    html: `<div style="
      width: 10px; height: 10px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 8px ${color};
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  return (
    <Marker position={[metar.lat, metar.lon]} icon={dotIcon}>
      {/* HOVER TOOLTIP (Windy Style) */}
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <div className="bg-[#0b0d17] text-white p-2 rounded-lg border border-white/10 font-mono text-[10px] min-w-[120px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
            <span className="font-bold text-cyber-cyan">{metar.icaoId}</span>
            <span style={{ color }}>{metar.vfr || 'UNK'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="opacity-50 uppercase">Viento</span>
              <span>{metar.wspd || 0}KT / {metar.wdir || 0}°</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50 uppercase">Temp</span>
              <span>{metar.temp || '--'}°C</span>
            </div>
          </div>
        </div>
      </Tooltip>

      {/* CLICK POPUP (Detailed View) */}
      <Popup>
        <div className="bg-[#020617] text-white p-3 rounded-xl border border-white/20 font-mono text-[11px] max-w-[280px]">
          <div className="text-[9px] text-cyber-cyan opacity-40 uppercase tracking-widest mb-1">Station Report</div>
          <div className="text-sm font-bold mb-2 flex items-center gap-2">
            {metar.icaoId} 
             <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold" style={{ backgroundColor: `${color}20`, color }}>
              {metar.vfr || 'Unknown'}
             </span>
          </div>
          <p className="text-[10px] opacity-70 mb-3 leading-relaxed border-l-2 border-cyber-cyan pl-2 overflow-auto max-h-[60px]">
            {metar.rawOb}
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-white/5 p-1.5 rounded border border-white/5">
              <div className="opacity-40 uppercase text-[8px]">Visibility</div>
              <div>{metar.visib || '>10'} SM</div>
            </div>
            <div className="bg-white/5 p-1.5 rounded border border-white/5">
              <div className="opacity-40 uppercase text-[8px]">Dew Point</div>
              <div>{metar.dewp || '--'}°C</div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
