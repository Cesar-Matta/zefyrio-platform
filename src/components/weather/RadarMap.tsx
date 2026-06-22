"use client";
import { useState, useEffect } from 'react';
import { Satellite, Map, CloudRain, Cloud, Sun } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── METAR Icon: Neon glowing airport dot ───────────────────────────────────
const createNeonIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-div-icon bg-transparent border-none',
  html: `<div style="
    width: 24px; 
    height: 24px; 
    background-color: ${isSelected ? 'var(--color-system-blue)' : 'rgba(11, 13, 23, 0.8)'}; 
    border: 2px solid ${isSelected ? '#FFFFFF' : 'var(--color-system-blue)'};
    border-radius: 50%;
    box-shadow: 0 0 ${isSelected ? '20px' : '8px'} var(--color-system-blue);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    ${isSelected 
      ? '<div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div>' 
      : '<div style="width:4px;height:4px;background:var(--color-system-blue);border-radius:50%;"></div>'}
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// ─── ADS-B Icon: Animated aircraft with true heading rotation ────────────────
const createAircraftIcon = (trueTrack: number, velocity: number, onGround: boolean) => {
  const color = onGround ? 'var(--color-system-orange)' : velocity > 250 ? '#FF6B6B' : 'var(--color-system-green)';
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
  
  // Weather Layers State
  const [showRadar, setShowRadar] = useState(false);
  const [showCloudsIr, setShowCloudsIr] = useState(false);
  const [showCloudsVis, setShowCloudsVis] = useState(false);
  const [rainPath, setRainPath] = useState<string | null>(null);
  const [satellitePath, setSatellitePath] = useState<string | null>(null);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => { 
        if (data.radar?.past?.length > 0) {
          setRainPath(data.radar.past[data.radar.past.length - 1].path); 
        } 
        if (data.satellite?.infrared?.length > 0) {
          setSatellitePath(data.satellite.infrared[data.satellite.infrared.length - 1].path);
        }
      })
      .catch(() => {
        setRainPath('/v2/radar/e780b0ed03f4');
        setSatellitePath('/v2/satellite/e780b0ed03f4');
      });
  }, []);

  const tileUrl = isSatellite
    ? "https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    : "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

  return (
    <div className="w-full h-[360px] rounded-2xl overflow-hidden relative z-0 shrink-0">
      {/* Crosshair Militar */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none z-[400] flex items-center justify-center">
        <div className="absolute w-full h-[1px] bg-white mix-blend-difference"></div>
        <div className="absolute w-[1px] h-full bg-white mix-blend-difference"></div>
        <div className="absolute w-full h-full border border-white mix-blend-difference rounded-full"></div>
      </div>

      {/* Contador ADS-B live */}
      {showAircraft && aircraftList.length > 0 && (
        <div className="absolute top-2 right-2 z-[500] bg-[var(--z-card)] border border-green-600/40 rounded-xl px-2 py-1 flex items-center gap-1 pointer-events-none shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[9px] font-medium text-green-600 tracking-tight">{aircraftList.length} AERONAVES</span>
        </div>
      )}

      <MapContainer 
        key={mapSessionKey}
        center={[initialLat, initialLon]} 
        zoom={9} 
        style={{ height: '100%', width: '100%', background: 'var(--z-bg)' }}
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
                opacity={1}
                permanent={false}
                className="adsb-tooltip"
              >
                <span style={{ 
                  fontFamily: 'system-ui, sans-serif', 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  color: 'var(--z-text)',
                  background: 'var(--z-card)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--z-border)',
                  boxShadow: 'var(--z-shadow)'
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
              opacity={1}
              permanent={false}
            >
              <div style={{ 
                fontFamily: 'system-ui, sans-serif', 
                fontSize: '10px', 
                background: 'var(--z-card)',
                color: 'var(--z-text)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--z-border)',
                minWidth: '110px',
                boxShadow: 'var(--z-shadow)'
              }}>
                <div style={{ color: 'var(--z-cyan)', fontWeight: 'bold', fontSize: '11px' }}>{aircraft.callsign}</div>
                <div style={{ color: 'var(--z-muted)', marginTop: '3px' }}>
                  ALT: {aircraft.baroAltitude ? <strong style={{color: 'var(--z-text)'}}>{Math.round(aircraft.baroAltitude * 3.28084).toLocaleString()} ft</strong> : 'N/A'}
                </div>
                <div style={{ color: 'var(--z-muted)' }}>
                  GS: {aircraft.velocity ? <strong style={{color: 'var(--z-text)'}}>{Math.round(aircraft.velocity * 1.944)} nudos</strong> : 'N/A'}
                </div>
                <div style={{ color: 'var(--z-muted)', fontSize: '8px', marginTop: '4px', textTransform: 'uppercase' }}>
                  {aircraft.originCountry} · {aircraft.positionSource === 0 ? 'ADS-B' : aircraft.positionSource === 2 ? 'MLAT' : 'ASTERIX'}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Weather Tile Layers */}
        {showRadar && rainPath && (
          <TileLayer
            url={`https://tilecache.rainviewer.com${rainPath}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.65} maxNativeZoom={6} maxZoom={20}
            eventHandlers={{ tileerror: (e) => { (e.tile as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; } }}
          />
        )}
        {showCloudsIr && satellitePath && (
          <TileLayer
            url={`https://tilecache.rainviewer.com${satellitePath}/256/{z}/{x}/{y}/2/0_0.png`}
            opacity={0.4} maxNativeZoom={10} maxZoom={18}
            eventHandlers={{ tileerror: (e) => { (e.tile as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; } }}
          />
        )}
        {showCloudsVis && (
          <TileLayer
            url="https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes_east_fulldisk_ch02/{z}/{x}/{y}.png"
            opacity={0.65} maxNativeZoom={6} maxZoom={20}
            eventHandlers={{ tileerror: (e) => { (e.tile as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; } }}
          />
        )}

      </MapContainer>
      
      {/* SAT / MAP toggle button */}
      <button
        onClick={() => setIsSatellite(prev => !prev)}
        className="absolute bottom-2 left-2 z-[500] flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-medium tracking-tight transition-all duration-300"
        style={{
          background: isSatellite ? 'rgba(0,240,255,0.15)' : 'rgba(0,0,0,0.65)',
          borderColor: isSatellite ? 'var(--color-system-blue)' : 'rgba(255,255,255,0.2)',
          color: isSatellite ? 'var(--color-system-blue)' : 'rgba(255,255,255,0.6)',
          boxShadow: isSatellite ? '0 0 8px rgba(0,240,255,0.4)' : 'none',
        }}
      >
        {isSatellite
          ? <><Satellite size={10} /><span>SAT</span></>
          : <><Map size={10} /><span>MAP</span></>
        }
      </button>

      {/* Weather Layers Toggle */}
      <div className="absolute bottom-2 right-2 z-[500] flex flex-col items-end gap-2">
        {showWeatherMenu && (
          <div className="bg-black/90 backdrop-blur-md border border-white/20 p-2 rounded-xl flex flex-col gap-2 animate-in slide-in-from-bottom-2">
            <button onClick={() => setShowRadar(!showRadar)} className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${showRadar ? 'bg-[#00BFFF]/20 border-[#00BFFF] text-[#00BFFF]' : 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white'}`}>
              <CloudRain size={12} /> Radar de Lluvia
            </button>
            <button onClick={() => setShowCloudsIr(!showCloudsIr)} className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${showCloudsIr ? 'bg-[#9333EA]/20 border-[#9333EA] text-[#D8B4FE]' : 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white'}`}>
              <Cloud size={12} /> Nubes Infrarrojas
            </button>
            <button onClick={() => setShowCloudsVis(!showCloudsVis)} className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${showCloudsVis ? 'bg-[#FBBF24]/20 border-[#FBBF24] text-[#FDE68A]' : 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white'}`}>
              <Sun size={12} /> Nubes Visibles
            </button>
          </div>
        )}
        <button
          onClick={() => setShowWeatherMenu(!showWeatherMenu)}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${showWeatherMenu ? 'bg-[#00BFFF] text-white border-[#00BFFF]' : 'bg-[var(--z-card)] text-[var(--z-text)] border-[var(--z-border)]'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
        </button>
      </div>

      {/* Radar Sweep Animation Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[400] opacity-20">
         <div className="w-full h-full rounded-full border border-[var(--z-border)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 animate-ping" style={{ animationDuration: '4s' }}></div>
      </div>
    </div>
  );
}
