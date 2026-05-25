"use client";
import { useState } from 'react';
import { Satellite, Map } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── METAR Icon: Neon glowing airport dot ───────────────────────────────────
const createNeonIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-div-icon bg-transparent border-none',
  html: `<div style="
    width: 24px; 
    height: 24px; 
    background-color: ${isSelected ? '#00F0FF' : 'rgba(11, 13, 23, 0.8)'}; 
    border: 2px solid ${isSelected ? '#FFFFFF' : '#00F0FF'};
    border-radius: 50%;
    box-shadow: 0 0 ${isSelected ? '20px' : '8px'} #00F0FF;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    ${isSelected 
      ? '<div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div>' 
      : '<div style="width:4px;height:4px;background:#00F0FF;border-radius:50%;"></div>'}
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// ─── ADS-B Icon: Animated aircraft with true heading rotation ────────────────
const createAircraftIcon = (trueTrack: number, velocity: number, onGround: boolean) => {
  const color = onGround ? '#FFB800' : velocity > 250 ? '#FF6B6B' : '#00FF66';
  const size = velocity > 300 ? 22 : 18;
  // Sumamos 45° porque el SVG original apunta a la derecha (este), no al norte
  const rotate = (trueTrack || 0) - 45;
  
  return L.divIcon({
    className: 'adsb-icon bg-transparent border-none',
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        transform: rotate(${rotate}deg);
        filter: drop-shadow(0 0 4px ${color});
        transition: transform 0.5s ease;
      ">
        <svg viewBox="0 0 24 24" fill="${color}" opacity="0.95" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ─── Map Event Handler ─────────────────────────────────────────────────────
function MapEvents({ onMoveEnd }: { onMoveEnd: (bbox: string) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const bboxStr = `${sw.lat.toFixed(2)},${sw.lng.toFixed(2)},${ne.lat.toFixed(2)},${ne.lng.toFixed(2)}`;
      onMoveEnd(bboxStr);
    },
  });
  return null;
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface AircraftState {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lon: number;
  baroAltitude: number;
  geoAltitude: number;
  velocity: number;      // m/s → * 1.944 = knots
  trueTrack: number;     // grados (0=Norte)
  verticalRate: number;  // m/s
  onGround: boolean;
  squawk: string;
  positionSource: number; // 0=ADS-B, 1=ASTERIX, 2=MLAT
}

export interface RadarMetar {
  icaoId: string;
  name?: string;
  lat?: number;
  lon?: number;
  fltcat?: string;
  rawOb?: string;
  [key: string]: unknown;
}

interface RadarMapProps {
  initialLat: number;
  initialLon: number;
  metarList: RadarMetar[];
  selectedIcao: string | null;
  onSelect: (metar: RadarMetar) => void;
  onMapMove: (bbox: string) => void;
  aircraftList?: AircraftState[];
  showAircraft?: boolean;
}

export default function RadarMap({ 
  initialLat, 
  initialLon, 
  metarList, 
  selectedIcao, 
  onSelect, 
  onMapMove,
  aircraftList = [],
  showAircraft = true,
}: RadarMapProps) {
  const [mapSessionKey] = useState(() => Math.random().toString(36).substring(7));
  const [isSatellite, setIsSatellite] = useState(false);

  const tileUrl = isSatellite
    ? "https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    : "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

  return (
    <div className="w-full h-[220px] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-0 shrink-0">
      
      {/* Crosshair Militar */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none z-[400] flex items-center justify-center opacity-30">
        <div className="absolute w-full h-[1px] bg-white"></div>
        <div className="absolute w-[1px] h-full bg-white"></div>
        <div className="absolute w-full h-full border border-white rounded-full"></div>
      </div>

      {/* Contador ADS-B live */}
      {showAircraft && aircraftList.length > 0 && (
        <div className="absolute top-2 right-2 z-[500] bg-black/70 border border-[#00FF66]/40 rounded-xl px-2 py-1 flex items-center gap-1 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse"></div>
          <span className="text-[9px] font-mono text-[#00FF66] tracking-widest">{aircraftList.length} AERONAVES</span>
        </div>
      )}

      <MapContainer 
        key={mapSessionKey}
        center={[initialLat, initialLon]} 
        zoom={9} 
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={tileUrl}
          subdomains={["0","1","2","3"]}
          maxZoom={22}
          maxNativeZoom={20}
        />
        <MapEvents onMoveEnd={(bbox) => onMapMove(bbox)} />
        
        {/* ── Marcadores METAR (Aeropuertos) ── */}
        {metarList.map((m) => {
          const lat = m.lat !== undefined ? m.lat : initialLat;
          const lon = m.lon !== undefined ? m.lon : initialLon;
          return (
            <Marker 
              key={`metar-${m.icaoId}`}
              position={[lat, lon]}
              icon={createNeonIcon(m.icaoId === selectedIcao)}
              eventHandlers={{
                click: () => onSelect(m),
              }}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -12]} 
                opacity={0.9}
                permanent={false}
                className="adsb-tooltip"
              >
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '10px', 
                  color: '#00F0FF',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,240,255,0.3)'
                }}>
                  {m.icaoId}
                </span>
              </Tooltip>
            </Marker>
          );
        })}

        {/* ── Marcadores ADS-B (Aeronaves en Vuelo) ── */}
        {showAircraft && aircraftList.map((aircraft) => (
          <Marker
            key={`adsb-${aircraft.icao24}`}
            position={[aircraft.lat, aircraft.lon]}
            icon={createAircraftIcon(aircraft.trueTrack, aircraft.velocity, aircraft.onGround)}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -10]} 
              opacity={0.92}
              permanent={false}
            >
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '10px', 
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0,255,102,0.4)',
                minWidth: '100px'
              }}>
                <div style={{ color: '#00FF66', fontWeight: 'bold' }}>{aircraft.callsign}</div>
                <div style={{ color: '#aaa', marginTop: '2px' }}>
                  ALT: {aircraft.baroAltitude ? `${Math.round(aircraft.baroAltitude * 3.28084).toLocaleString()} ft` : 'N/A'}
                </div>
                <div style={{ color: '#aaa' }}>
                  GS: {aircraft.velocity ? `${Math.round(aircraft.velocity * 1.944)} kts` : 'N/A'}
                </div>
                <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>
                  {aircraft.originCountry} · {aircraft.positionSource === 0 ? 'ADS-B' : aircraft.positionSource === 2 ? 'MLAT' : 'ASTERIX'}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      
      {/* SAT / MAP toggle button */}
      <button
        onClick={() => setIsSatellite(prev => !prev)}
        className="absolute bottom-2 left-2 z-[500] flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono tracking-widest transition-all duration-300"
        style={{
          background: isSatellite ? 'rgba(0,240,255,0.15)' : 'rgba(0,0,0,0.65)',
          borderColor: isSatellite ? '#00F0FF' : 'rgba(255,255,255,0.2)',
          color: isSatellite ? '#00F0FF' : 'rgba(255,255,255,0.6)',
          boxShadow: isSatellite ? '0 0 8px rgba(0,240,255,0.4)' : 'none',
        }}
      >
        {isSatellite
          ? <><Satellite size={10} /><span>SAT</span></>
          : <><Map size={10} /><span>MAP</span></>
        }
      </button>

      {/* Radar Sweep Animation Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[400] opacity-20">
         <div className="w-full h-full rounded-full border border-cyber-cyan absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 animate-ping" style={{ animationDuration: '4s' }}></div>
      </div>
    </div>
  );
}
